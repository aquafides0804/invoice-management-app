'use client';

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

Font.register({
  family: 'IPAGothic',
  src: '/fonts/IPAGothic.ttf',
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'IPAGothic',
    fontSize: 9,
    padding: 30,
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  clientName: {
    fontSize: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 4,
    marginBottom: 10,
    width: 250,
  },
  metaTable: {
    width: 200,
    fontSize: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  companyInfo: {
    textAlign: 'right',
    fontSize: 8,
    lineHeight: 1.4,
    marginTop: 15,
  },
  totalBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#f5f5f5',
    padding: 6,
    marginVertical: 10,
    width: 250,
  },
  totalLabel: {
    fontSize: 10,
    marginRight: 10,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  table: {
    width: '100%',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#eee',
    padding: 4,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  colDate: { width: '18%' },
  colName: { width: '46%' },
  colPrice: { width: '12%', textAlign: 'right' },
  colQty: { width: '8%', textAlign: 'center' },
  colTotal: { width: '16%', textAlign: 'right' },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  bankBox: {
    width: '55%',
    fontSize: 8,
    lineHeight: 1.5,
  },
  calcBox: {
    width: '40%',
    fontSize: 8,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
  },
});

type Movie = {
  id: string;
  title: string;
  unit_price: number;
  delivered_date: string | null;
  created_at: string;
};

type Props = {
  clientName: string;
  honorific: string;
  issueDate: string;
  dueDate: string;
  invoiceNumber: string;
  titleName: string;
  items: Movie[];
};

export default function InvoicePDF({
  clientName,
  honorific,
  issueDate,
  dueDate,
  invoiceNumber,
  titleName,
  items,
}: Props) {
  const subtotal = items.reduce((sum, item) => sum + (Number(item.unit_price) || 0), 0);
  const tax = Math.floor(subtotal * 0.1);
  const total = subtotal + tax;

  const fullClientName = honorific ? `${clientName} ${honorific}` : clientName;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>請求書</Text>

        <View style={styles.header}>
          <View>
            <Text style={styles.clientName}>{fullClientName}</Text>
            <Text style={{ marginBottom: 10 }}>{titleName}</Text>
            <Text>下記のとおり、ご請求申し上げます。</Text>
            
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>ご請求額(税込)</Text>
              <Text style={styles.totalAmount}>¥{total.toLocaleString()}</Text>
            </View>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <View style={styles.metaTable}>
              <View style={styles.metaRow}>
                <Text>請求No.</Text>
                <Text>{invoiceNumber}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text>請求日</Text>
                <Text>{issueDate}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text>お支払い期限</Text>
                <Text>{dueDate}</Text>
              </View>
            </View>

            <View style={styles.companyInfo}>
              <Text style={{ fontSize: 10, fontWeight: 'bold' }}>aquafides</Text>
              <Text>北九州市小倉北区足立2-5-29 220</Text>
              <Text>yukaru0531@gmail.com</Text>
              <Text>登録番号: T1810864490078</Text>
            </View>
          </View>
        </View>

        {/* 明細テーブル */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDate}>取引日</Text>
            <Text style={styles.colName}>品名</Text>
            <Text style={styles.colPrice}>単価(税抜)</Text>
            <Text style={styles.colQty}>数量</Text>
            <Text style={styles.colTotal}>金額(税抜)</Text>
          </View>
          {items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.colDate}>
                {(item.delivered_date || item.created_at || '').substring(0, 10)}
              </Text>
              <Text style={styles.colName}>{item.title}</Text>
              <Text style={styles.colPrice}>¥{Number(item.unit_price).toLocaleString()}</Text>
              <Text style={styles.colQty}>1</Text>
              <Text style={styles.colTotal}>¥{Number(item.unit_price).toLocaleString()}</Text>
            </View>
          ))}
        </View>

        {/* 下部情報 */}
        <View style={styles.summaryContainer}>
          <View style={styles.bankBox}>
            <Text style={{ fontWeight: 'bold', marginBottom: 3 }}>お振込先</Text>
            <Text>【振込先】西日本シティ銀行 城野支店</Text>
            <Text>(普) 3331606 モチヅキ シュン</Text>
            <Text style={{ marginTop: 5, color: '#666' }}>※振込手数料は貴社にてご負担ください。</Text>
          </View>

          <View style={styles.calcBox}>
            <View style={styles.calcRow}>
              <Text>小計(税抜)</Text>
              <Text>¥{subtotal.toLocaleString()}</Text>
            </View>
            <View style={styles.calcRow}>
              <Text>消費税(10%)</Text>
              <Text>¥{tax.toLocaleString()}</Text>
            </View>
            <View style={[styles.calcRow, { borderBottomWidth: 0, fontWeight: 'bold' }]}>
              <Text>合計(税込)</Text>
              <Text>¥{total.toLocaleString()}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}