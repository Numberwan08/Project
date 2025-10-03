import React from "react";

function Pagination({ page, totalPages, onPageChange }) {
  return (
    <div className="flex justify-center items-center gap-2 mt-4 text-base">
      <button
        className="btn btn-sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
      >
        ก่อนหน้า
      </button>
      <span>
        หน้า {page} / {totalPages || 1}
      </span>
      <button
        className="btn btn-sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages || totalPages === 0}
      >
        ถัดไป
      </button>
    </div>
  );
}

export default Pagination;
