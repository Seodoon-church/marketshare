

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-[8rem] font-extrabold leading-none text-gray-200 select-none sm:text-[10rem]">
        404
      </p>

      <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
        페이지를 찾을 수 없습니다
      </h1>

      <p className="mt-4 max-w-md text-gray-500">
        요청하신 페이지가 존재하지 않거나, 이동되었거나, 삭제되었을 수 있습니다.
        주소를 다시 확인해 주세요.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          메인으로 돌아가기
        </a>

        <a
          href="/products"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          상품 둘러보기
        </a>
      </div>
    </div>
  );
}
