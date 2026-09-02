'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

import InvoicePDF from '@/components/InvoicePDF';

type Movie = {
  id: string;
  title: string;
  status: string;
  client_name: string;
  unit_price: number;
  delivered_date: string | null;
  created_at: string;
};

type Invoice = {
  id: string;
  invoice_number: string;
  client_name: string;
  total_amount: number;
  status: string;
  issue_date: string;
  due_date: string;
};

const MOVIE_STATUS_OPTIONS = ['未着手', '編集', 'CL確認中', 'CLから修正', '修正', '修正提出', '納品完了'];
const INVOICE_STATUS_OPTIONS = ['未請求', '請求済み', '入金待ち', '入金完了'];

export default function InvoiceManagementPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [selectedClient, setSelectedClient] = useState('ALL');
  
  const [customClientName, setCustomClientName] = useState('');
  const [honorific, setHonorific] = useState('御中');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [readyToDownload, setReadyToDownload] = useState(false);

  useEffect(() => {
    setIsClient(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [moviesRes, invoicesRes] = await Promise.all([
      supabase.from('movies').select('*').order('created_at', { ascending: false }),
      supabase.from('invoices').select('*').order('created_at', { ascending: false })
    ]);

    if (!moviesRes.error && moviesRes.data) setMovies(moviesRes.data);
    if (!invoicesRes.error && invoicesRes.data) setInvoices(invoicesRes.data);
    setLoading(false);
  };

  const clients = Array.from(new Set(movies.map((m) => m.client_name).filter(Boolean)));

  const filteredMovies = movies.filter((movie) => {
    const dateStr = movie.delivered_date || movie.created_at;
    const matchesMonth = selectedMonth ? dateStr?.startsWith(selectedMonth) : true;
    const matchesClient = selectedClient === 'ALL' || movie.client_name === selectedClient;
    return matchesMonth && matchesClient;
  });

  const handleClientSelectChange = (client: string) => {
    setSelectedClient(client);
    setSelectedIds([]);
    setCustomClientName(client !== 'ALL' ? client : '');
    setReadyToDownload(false);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredMovies.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMovies.map((m) => m.id));
    }
    setReadyToDownload(false);
  };

  const handleUnitPriceChange = async (id: string, price: number) => {
    setMovies((prev) => prev.map((m) => (m.id === id ? { ...m, unit_price: price } : m)));
    await supabase.from('movies').update({ unit_price: price }).eq('id', id);
  };

  const handleMovieStatusChange = async (id: string, newStatus: string) => {
    setMovies((prev) => prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m)));
    await supabase.from('movies').update({ status: newStatus }).eq('id', id);
  };

  const handleInvoiceStatusChange = async (id: string, newStatus: string) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, status: newStatus } : inv)));
    await supabase.from('invoices').update({ status: newStatus }).eq('id', id);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
    setReadyToDownload(false);
  };

  const selectedMovies = movies.filter((m) => selectedIds.includes(m.id));
  const subtotal = selectedMovies.reduce((sum, m) => sum + (Number(m.unit_price) || 0), 0);
  const tax = Math.floor(subtotal * 0.1);
  const total = subtotal + tax;

  const getDueDate = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    const nextMonthDate = new Date(year, month, 25);
    return nextMonthDate.toISOString().substring(0, 10);
  };

  const finalClientName = customClientName || (selectedClient !== 'ALL' ? selectedClient : '');

  // DB保存を行ってからダウンロードボタンを準備する処理
  const handleCreateAndRecordInvoice = async () => {
    if (!finalClientName || selectedIds.length === 0) return;

    const invNum = `INV-${selectedMonth.replace('-', '')}-${String(invoices.length + 1).padStart(3, '0')}`;
    const issueDate = new Date().toISOString().substring(0, 10);
    const dueDate = getDueDate(selectedMonth);

    const { data, error } = await supabase.from('invoices').insert([
      {
        invoice_number: invNum,
        client_name: `${finalClientName} ${honorific}`.trim(),
        total_amount: total,
        status: '請求済み',
        issue_date: issueDate,
        due_date: dueDate,
      }
    ]).select();

    if (!error && data) {
      setInvoices((prev) => [data[0], ...prev]);
      setReadyToDownload(true);
    } else {
      alert(`保存失敗の詳細: ${error?.message || JSON.stringify(error)}`);
      console.error('Supabase Insert Error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-8">
      <header className="max-w-6xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">請求書作成・案件管理システム</h1>
          <p className="text-xs text-slate-500 mt-1">案件の一覧管理・集計および各種請求書の発行・追跡</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-8">
        {/* 操作・設定パネル */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
          <div className="flex flex-wrap gap-4 w-full lg:w-auto">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">対象年月</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setReadyToDownload(false);
                }}
                className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">絞り込み</label>
              <select
                value={selectedClient}
                onChange={(e) => handleClientSelectChange(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">すべてのクライアント</option>
                {clients.map((client) => (
                  <option key={client} value={client}>
                    {client}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-l border-slate-200 pl-4 flex gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">請求書宛名</label>
                <input
                  type="text"
                  placeholder="例: 株式会社TIAMI"
                  value={customClientName}
                  onChange={(e) => {
                    setCustomClientName(e.target.value);
                    setReadyToDownload(false);
                  }}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 w-48 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">敬称</label>
                <select
                  value={honorific}
                  onChange={(e) => {
                    setHonorific(e.target.value);
                    setReadyToDownload(false);
                  }}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="御中">御中</option>
                  <option value="様">様</option>
                  <option value="">なし</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-6 w-full lg:w-auto border-t lg:border-t-0 border-slate-100 pt-4 lg:pt-0">
            <div className="text-left lg:text-right">
              <div className="text-xs text-slate-500">選択中（{selectedIds.length}件）の請求額</div>
              <div className="text-2xl font-extrabold text-emerald-600 tracking-tight">
                ¥{total.toLocaleString()}
                <span className="text-xs font-normal text-slate-500 ml-1">（税込）</span>
              </div>
            </div>

            {isClient && selectedIds.length > 0 && (
              !finalClientName ? (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
                  ⚠️ 請求書の宛名を入力してください
                </div>
              ) : !readyToDownload ? (
                <button
                  onClick={handleCreateAndRecordInvoice}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-all shadow-sm cursor-pointer"
                >
                  📄 請求書を発行して保存
                </button>
              ) : (
                <PDFDownloadLink
                  document={
                    <InvoicePDF
                      clientName={finalClientName}
                      honorific={honorific}
                      issueDate={new Date().toISOString().substring(0, 10)}
                      dueDate={getDueDate(selectedMonth)}
                      invoiceNumber={`INV-${selectedMonth.replace('-', '')}-${String(invoices.length).padStart(3, '0')}`}
                      titleName={`${selectedMonth.replace('-', '年')}月分請求書`}
                      items={selectedMovies}
                    />
                  }
                  fileName={`請求書_${finalClientName}_${selectedMonth}.pdf`}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-all shadow-sm cursor-pointer inline-block"
                >
                  {({ loading: pdfLoading }) =>
                    pdfLoading ? 'PDF準備中...' : '⬇️ 請求書PDFをダウンロード'
                  }
                </PDFDownloadLink>
              )
            )}
          </div>
        </div>

        {/* 案件一覧テーブル */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <button
              onClick={handleSelectAll}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              {selectedIds.length === filteredMovies.length && filteredMovies.length > 0
                ? '選択をすべて解除'
                : '表示中の全案件を選択'}
            </button>
            <span className="text-xs text-slate-500">該当案件: {filteredMovies.length} 件</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">データを読み込んでいます...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="p-3.5 w-12 text-center">選択</th>
                    <th className="p-3.5">案件名 / タイトル</th>
                    <th className="p-3.5">クライアント</th>
                    <th className="p-3.5 w-36">ステータス</th>
                    <th className="p-3.5 w-40 text-right">単価 (税抜)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredMovies.map((movie) => {
                    const isSelected = selectedIds.includes(movie.id);
                    return (
                      <tr
                        key={movie.id}
                        className={`transition-colors ${
                          isSelected ? 'bg-emerald-50/60' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="p-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(movie.id)}
                            className="rounded border-slate-300 accent-emerald-600 w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="p-3.5 font-medium text-slate-800">{movie.title}</td>
                        <td className="p-3.5 text-slate-500">{movie.client_name || '-'}</td>
                        <td className="p-3.5">
                          <select
                            value={movie.status}
                            onChange={(e) => handleMovieStatusChange(movie.id, e.target.value)}
                            className="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-slate-400"
                          >
                            {MOVIE_STATUS_OPTIONS.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-slate-400 text-xs">¥</span>
                            <input
                              type="number"
                              value={movie.unit_price || 0}
                              onChange={(e) => handleUnitPriceChange(movie.id, Number(e.target.value))}
                              className="bg-white border border-slate-300 rounded-md px-2 py-1 text-sm text-right text-emerald-700 font-mono w-28 focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 請求書発行履歴・ステータス追跡セクション */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-8">
          <div className="p-4 border-b border-slate-200 bg-slate-100 flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-800">📋 発行済み請求書・入金追跡</h2>
            <span className="text-xs text-slate-500">発行件数: {invoices.length} 件</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3.5">請求No.</th>
                  <th className="p-3.5">宛名</th>
                  <th className="p-3.5">請求額 (税込)</th>
                  <th className="p-3.5">発行日</th>
                  <th className="p-3.5">支払期限</th>
                  <th className="p-3.5">ステータス</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 text-sm">
                      まだ発行された請求書はありません。
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-mono font-medium text-slate-700">{inv.invoice_number}</td>
                      <td className="p-3.5 font-medium text-slate-800">{inv.client_name}</td>
                      <td className="p-3.5 font-bold text-emerald-600">¥{Number(inv.total_amount).toLocaleString()}</td>
                      <td className="p-3.5 text-slate-500">{inv.issue_date}</td>
                      <td className="p-3.5 text-slate-500">{inv.due_date}</td>
                      <td className="p-3.5">
                        <select
                          value={inv.status}
                          onChange={(e) => handleInvoiceStatusChange(inv.id, e.target.value)}
                          className={`border rounded-md px-2.5 py-1 text-xs font-semibold focus:outline-none ${
                            inv.status === '入金完了'
                              ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                              : inv.status === '入金待ち'
                              ? 'bg-amber-100 border-amber-300 text-amber-800'
                              : 'bg-slate-100 border-slate-300 text-slate-700'
                          }`}
                        >
                          {INVOICE_STATUS_OPTIONS.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}