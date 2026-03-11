import * as XLSX from 'xlsx';

/**
 * Excel bulk operations service (client-side)
 * Uses xlsx library for Excel file generation and parsing
 */

interface ProductExcelRow {
  name: string;
  categorySlug: string;
  price: number;
  salePrice: number | null;
  costPrice: number | null;
  stock: number;
  sku: string;
  description: string;
  imageUrl: string;
  shippingFee: number | null;
  freeShippingThreshold: number | null;
  tags: string;
}

/**
 * Format date as YYYY-MM-DD HH:mm
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * Get current date as YYYYMMDD string
 */
function getDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Download product registration template Excel file
 */
export function downloadProductTemplate(): void {
  const template = [
    {
      '상품명': '예시상품',
      '카테고리(slug)': 'food',
      '판매가': 10000,
      '할인가': 8000,
      '원가': 5000,
      '재고': 100,
      'SKU': 'SKU-001',
      '상품설명': '맛있는 상품입니다',
      '이미지URL': '',
      '배송비': 3000,
      '무료배송기준': 50000,
      '태그': '식품,인기'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(template);

  // Set column widths
  ws['!cols'] = [
    { wch: 20 }, // 상품명
    { wch: 15 }, // 카테고리(slug)
    { wch: 10 }, // 판매가
    { wch: 10 }, // 할인가
    { wch: 10 }, // 원가
    { wch: 10 }, // 재고
    { wch: 15 }, // SKU
    { wch: 30 }, // 상품설명
    { wch: 40 }, // 이미지URL
    { wch: 10 }, // 배송비
    { wch: 12 }, // 무료배송기준
    { wch: 20 }  // 태그
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '상품등록');
  XLSX.writeFile(wb, '상품등록_템플릿.xlsx');
}

/**
 * Parse product Excel file and validate rows
 */
export async function parseProductExcel(
  file: File
): Promise<{
  rows: ProductExcelRow[];
  errors: Array<{ row: number; field: string; message: string }>;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet) as any[];

        const rows: ProductExcelRow[] = [];
        const errors: Array<{ row: number; field: string; message: string }> = [];

        jsonData.forEach((row, index) => {
          const rowNumber = index + 2; // +2 because Excel is 1-indexed and first row is header
          const rowErrors: Array<{ field: string; message: string }> = [];

          // Validate 상품명
          const name = String(row['상품명'] || '').trim();
          if (!name) {
            rowErrors.push({ field: '상품명', message: '상품명은 필수입니다' });
          }

          // Validate 카테고리
          const categorySlug = String(row['카테고리(slug)'] || '').trim();
          if (!categorySlug) {
            rowErrors.push({ field: '카테고리(slug)', message: '카테고리는 필수입니다' });
          }

          // Validate 판매가
          const price = Number(row['판매가']);
          if (isNaN(price) || price <= 0) {
            rowErrors.push({ field: '판매가', message: '판매가는 0보다 큰 숫자여야 합니다' });
          }

          // Validate 재고
          const stock = Number(row['재고']);
          if (isNaN(stock) || stock < 0) {
            rowErrors.push({ field: '재고', message: '재고는 0 이상의 숫자여야 합니다' });
          }

          if (rowErrors.length > 0) {
            rowErrors.forEach((error) => {
              errors.push({ row: rowNumber, field: error.field, message: error.message });
            });
          } else {
            // Parse optional fields
            const salePrice = row['할인가'] ? Number(row['할인가']) : null;
            const costPrice = row['원가'] ? Number(row['원가']) : null;
            const shippingFee = row['배송비'] ? Number(row['배송비']) : null;
            const freeShippingThreshold = row['무료배송기준'] ? Number(row['무료배송기준']) : null;

            rows.push({
              name,
              categorySlug,
              price,
              salePrice: salePrice && !isNaN(salePrice) ? salePrice : null,
              costPrice: costPrice && !isNaN(costPrice) ? costPrice : null,
              stock,
              sku: String(row['SKU'] || '').trim(),
              description: String(row['상품설명'] || '').trim(),
              imageUrl: String(row['이미지URL'] || '').trim(),
              shippingFee: shippingFee && !isNaN(shippingFee) ? shippingFee : null,
              freeShippingThreshold: freeShippingThreshold && !isNaN(freeShippingThreshold) ? freeShippingThreshold : null,
              tags: String(row['태그'] || '').trim()
            });
          }
        });

        resolve({ rows, errors });
      } catch (error) {
        reject(new Error('Excel 파일 파싱 중 오류가 발생했습니다'));
      }
    };

    reader.onerror = () => {
      reject(new Error('파일을 읽을 수 없습니다'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Generic export function to Excel
 */
export function exportToExcel(
  data: any[],
  columns: Array<{ header: string; key: string; width?: number }>,
  filename: string
): void {
  // Transform data to use headers
  const transformedData = data.map((item) => {
    const row: any = {};
    columns.forEach((col) => {
      row[col.header] = item[col.key];
    });
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(transformedData);

  // Set column widths
  if (columns.some((col) => col.width)) {
    ws['!cols'] = columns.map((col) => ({ wch: col.width || 15 }));
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, filename);
}

/**
 * Export products to Excel
 */
export function exportProducts(
  products: Array<{
    name: string;
    categoryName: string;
    price: number;
    salePrice: number | null;
    stock: number;
    sku: string;
    status: string;
    salesCount: number;
  }>
): void {
  const columns = [
    { header: '상품명', key: 'name', width: 25 },
    { header: '카테고리', key: 'categoryName', width: 15 },
    { header: '판매가', key: 'price', width: 12 },
    { header: '할인가', key: 'salePrice', width: 12 },
    { header: '재고', key: 'stock', width: 10 },
    { header: 'SKU', key: 'sku', width: 15 },
    { header: '상태', key: 'status', width: 10 },
    { header: '판매수', key: 'salesCount', width: 10 }
  ];

  const filename = `상품목록_${getDateString()}.xlsx`;
  exportToExcel(products, columns, filename);
}

/**
 * Export orders to Excel
 */
export function exportOrders(
  orders: Array<{
    orderNumber: string;
    userName: string;
    mallName: string;
    totalAmount: number;
    status: string;
    paymentMethod: string;
    createdAt: Date;
  }>
): void {
  // Format data
  const formattedOrders = orders.map((order) => ({
    orderNumber: order.orderNumber,
    userName: order.userName,
    mallName: order.mallName,
    totalAmount: order.totalAmount,
    status: order.status,
    paymentMethod: order.paymentMethod,
    createdAt: formatDate(order.createdAt)
  }));

  const columns = [
    { header: '주문번호', key: 'orderNumber', width: 20 },
    { header: '주문자', key: 'userName', width: 15 },
    { header: '몰이름', key: 'mallName', width: 20 },
    { header: '결제금액', key: 'totalAmount', width: 12 },
    { header: '주문상태', key: 'status', width: 12 },
    { header: '결제수단', key: 'paymentMethod', width: 12 },
    { header: '주문일시', key: 'createdAt', width: 18 }
  ];

  const filename = `주문목록_${getDateString()}.xlsx`;
  exportToExcel(formattedOrders, columns, filename);
}

/**
 * Export members to Excel
 */
export function exportMembers(
  members: Array<{
    name: string;
    email: string;
    phone: string;
    role: string;
    createdAt: Date;
    lastLoginAt: Date;
  }>
): void {
  // Format data
  const formattedMembers = members.map((member) => ({
    name: member.name,
    email: member.email,
    phone: member.phone,
    role: member.role,
    createdAt: formatDate(member.createdAt),
    lastLoginAt: formatDate(member.lastLoginAt)
  }));

  const columns = [
    { header: '이름', key: 'name', width: 15 },
    { header: '이메일', key: 'email', width: 25 },
    { header: '전화번호', key: 'phone', width: 15 },
    { header: '역할', key: 'role', width: 12 },
    { header: '가입일', key: 'createdAt', width: 18 },
    { header: '최근로그인', key: 'lastLoginAt', width: 18 }
  ];

  const filename = `회원목록_${getDateString()}.xlsx`;
  exportToExcel(formattedMembers, columns, filename);
}

/**
 * Export settlements to Excel
 */
export function exportSettlements(
  settlements: Array<{
    mallName: string;
    period: string;
    totalSales: number;
    totalCommission: number;
    totalSettlement: number;
    status: string;
  }>
): void {
  const columns = [
    { header: '몰이름', key: 'mallName', width: 20 },
    { header: '정산기간', key: 'period', width: 15 },
    { header: '총매출', key: 'totalSales', width: 15 },
    { header: '수수료', key: 'totalCommission', width: 15 },
    { header: '정산금액', key: 'totalSettlement', width: 15 },
    { header: '상태', key: 'status', width: 12 }
  ];

  const filename = `정산내역_${getDateString()}.xlsx`;
  exportToExcel(settlements, columns, filename);
}

/**
 * Download tracking number upload template
 */
export function downloadTrackingTemplate(): void {
  const template = [
    {
      '주문번호': 'MS-20260309-00001',
      '택배사코드': 'cj',
      '운송장번호': '1234567890'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(template);

  // Set column widths
  ws['!cols'] = [
    { wch: 20 }, // 주문번호
    { wch: 15 }, // 택배사코드
    { wch: 15 }  // 운송장번호
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '운송장등록');
  XLSX.writeFile(wb, '운송장등록_템플릿.xlsx');
}

/**
 * Parse tracking Excel file
 */
export async function parseTrackingExcel(
  file: File
): Promise<{
  rows: Array<{ orderNumber: string; carrierCode: string; trackingNumber: string }>;
  errors: Array<{ row: number; message: string }>;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet) as any[];

        const rows: Array<{ orderNumber: string; carrierCode: string; trackingNumber: string }> = [];
        const errors: Array<{ row: number; message: string }> = [];

        jsonData.forEach((row, index) => {
          const rowNumber = index + 2;

          const orderNumber = String(row['주문번호'] || '').trim();
          const carrierCode = String(row['택배사코드'] || '').trim();
          const trackingNumber = String(row['운송장번호'] || '').trim();

          if (!orderNumber) {
            errors.push({ row: rowNumber, message: '주문번호는 필수입니다' });
            return;
          }

          if (!carrierCode) {
            errors.push({ row: rowNumber, message: '택배사코드는 필수입니다' });
            return;
          }

          if (!trackingNumber) {
            errors.push({ row: rowNumber, message: '운송장번호는 필수입니다' });
            return;
          }

          rows.push({ orderNumber, carrierCode, trackingNumber });
        });

        resolve({ rows, errors });
      } catch (error) {
        reject(new Error('Excel 파일 파싱 중 오류가 발생했습니다'));
      }
    };

    reader.onerror = () => {
      reject(new Error('파일을 읽을 수 없습니다'));
    };

    reader.readAsArrayBuffer(file);
  });
}
