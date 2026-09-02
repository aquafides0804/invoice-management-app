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
    color: '#333333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  clientName: {
    fontSize: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 2,
    width: 250,
  },
  metaInfo: {
    textAlign: 'right',
    fontSize: 8,
    lineHeight: 1.4,
  },
  totalBox: {
    backgroundColor: '#f5f5f5',
    padding: 8,
    marginVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    width: 250,
  },
  totalLabel: {
    fontSize: 10,
    marginRight: 10,
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  table: {
    width: '100%',
    marginTop: 10,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    minHeight: 20,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#f9f9f9',
    fontWeight: 'bold',
  },
  colDate: { width: '20%', paddingLeft: 5 },
  colTitle: { width: '50%', paddingLeft: 5 },
  colPrice: { width: '15%', textAlign: 'right', paddingRight: 5 },
  colQty: { width: '10%', textAlign: 'center' },
  colTotal: { width: '15%', textAlign: 'right', paddingRight: 5 },
  summary: {
    marginTop: 10,
    alignSelf: 'flex-end',
    width: 200,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  bankInfo: {
    marginTop: 20,
    fontSize: 8,
    lineHeight: 1.4,
  },
});

export type Movie = {
  id: string;
  title: string;
  unit_price: number;
  status?: string;
  client_name?: string;
  delivered_date?: string | null;
  created_at?: string;
};

type InvoicePDFProps = {
  clientName: string;
  honorific?: string;
  issueDate: string;
  dueDate: string;
  invoiceNumber: string;
  titleName: string;
  items: Movie[];
};

export default function InvoicePDF({
  clientName,
  honorific = '御中',
  issueDate,
  dueDate,
  invoiceNumber,
  items,
}: InvoicePDFProps) {
  const subtotal = items.reduce((sum, item) => sum + (Number(item.unit_price) || 0), 0);
  const tax = Math.floor(subtotal * 0.1);
  const total = subtotal + tax;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>請 求 書</Text>
            <Text style={styles.clientName}>
              {clientName} {honorific}
            </Text>
          </View>
          <View style={styles.metaInfo}>
            <Text>請求No.: {invoiceNumber}</Text>
            <Text>請求日: {issueDate}</Text>
            <Text>お支払い期限: {dueDate}</Text>
            <Text style={{ marginTop: 10 }}>aquafides</Text>
            <Text>北九州市小倉北区足立2-5-29 220</Text>
            <Text>yukaru0531@gmail.com</Text>
            <Text>登録番号: T1810864490078</Text>
          </View>
        </View>

        <Text style={{ fontSize: 8, marginTop: 5 }}>下記の通り、ご請求申し上げます。</Text>

        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>ご請求額(税込)</Text>
          <Text style={styles.totalAmount}>¥{total.toLocaleString()}</Text>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.colDate}>取引日</Text>
            <Text style={styles.colTitle}>品名</Text>
            <Text style={styles.colPrice}>単価(税抜)</Text>
            <Text style={styles.colQty}>数量</Text>
            <Text style={styles.colTotal}>金額(税抜)</Text>
          </View>
          {items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.colDate}>{item.delivered_date || issueDate}</Text>
              <Text style={styles.colTitle}>{item.title}</Text>
              <Text style={styles.colPrice}>¥{Number(item.unit_price || 0).toLocaleString()}</Text>
              <Text style={styles.colQty}>1</Text>
              <Text style={styles.colTotal}>¥{Number(item.unit_price || 0).toLocaleString()}</Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 }}>
          <View style={styles.bankInfo}>
            <Text>お振込先</Text>
            <Text>【振込先】西日本シティ銀行 城野支店</Text>
            <Text>(普) 3331606 モチヅキ シュン</Text>
            <Text style={{ marginTop: 5, color: '#666666' }}>※振込手数料は貴社にてご負担ください。</Text>
          </View>

          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text>小計(税抜)</Text>
              <Text>¥{subtotal.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text>消費税(10%)</Text>
              <Text>¥{tax.toLocaleString()}</Text>
            </View>
            <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: '#000', paddingTop: 3 }]}>
              <Text style={{ fontWeight: 'bold' }}>合計(税込)</Text>
              <Text style={{ fontWeight: 'bold' }}>¥{total.toLocaleString()}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}