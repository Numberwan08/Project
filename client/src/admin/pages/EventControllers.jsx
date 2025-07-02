import React from 'react'

function EventControllers() {
  return (
    <div className="flex flex-col items-center text-center min-h-screen p-4 text-4xl">
      จัดการกิจกรรม
      
      <div className="mt-5">
        ปุ่มค้นหา
      </div>
      
       <div className="p-4 mt-3 overflow-x-auto">
        <table className="min-w-[1200px] w-full text-sm text-left text-gray-700 border border-gray-300">
          <thead className="bg-gray-200 text-gray-900">
            <tr>
              <th className="w-[10%] border text-center">ลำดับ</th>
              <th className="w-[20%] px-4 py-2 border">โปรไฟล์</th>
              <th className="w-[30%] px-4 py-2 border">ชื่อ</th>
              <th className="w-[20%] px-4 py-2 border">โพสต์</th>
              <th className="w-[20%] px-4 py-2 border">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-gray-100">
              <td className="w-[10%] text-center border">1</td>
              <td className="w-[20%] px-4 py-2 border">รูป</td>
              <td className="w-[30%] px-4 py-2 border">สมรักรักนะ</td>
              <td className="w-[20%] px-4 py-2 border">5 โพสต์</td>
              <td className="w-[20%] px-4 py-2 border">ดูรายละเอียด / บล็อค</td>
            </tr>
            <tr className="hover:bg-gray-100">
              <td className="w-[10%] text-center border">1</td>
              <td className="w-[20%] px-4 py-2 border">รูป</td>
              <td className="w-[30%] px-4 py-2 border">สมรักรักนะ</td>
              <td className="w-[20%] px-4 py-2 border">5 โพสต์</td>
              <td className="w-[20%] px-4 py-2 border">ดูรายละเอียด / บล็อค</td>
            </tr>
            <tr className="hover:bg-gray-100">
              <td className="w-[10%] text-center border">1</td>
              <td className="w-[20%] px-4 py-2 border">รูป</td>
              <td className="w-[30%] px-4 py-2 border">สมรักรักนะ</td>
              <td className="w-[20%] px-4 py-2 border">5 โพสต์</td>
              <td className="w-[20%] px-4 py-2 border">ดูรายละเอียด / บล็อค</td>
            </tr>
            <tr className="hover:bg-gray-100">
              <td className="w-[10%] text-center border">1</td>
              <td className="w-[20%] px-4 py-2 border">รูป</td>
              <td className="w-[30%] px-4 py-2 border">สมรักรักนะ</td>
              <td className="w-[20%] px-4 py-2 border">5 โพสต์</td>
              <td className="w-[20%] px-4 py-2 border">ดูรายละเอียด / บล็อค</td>
            </tr>
            <tr className="hover:bg-gray-100">
              <td className="w-[10%] text-center border">1</td>
              <td className="w-[20%] px-4 py-2 border">รูป</td>
              <td className="w-[30%] px-4 py-2 border">สมรักรักนะ</td>
              <td className="w-[20%] px-4 py-2 border">5 โพสต์</td>
              <td className="w-[20%] px-4 py-2 border">ดูรายละเอียด / บล็อค</td>
            </tr>
            <tr className="hover:bg-gray-100">
              <td className="w-[10%] text-center border">1</td>
              <td className="w-[20%] px-4 py-2 border">รูป</td>
              <td className="w-[30%] px-4 py-2 border">สมรักรักนะ</td>
              <td className="w-[20%] px-4 py-2 border">5 โพสต์</td>
              <td className="w-[20%] px-4 py-2 border">ดูรายละเอียด / บล็อค</td>
            </tr>
            <tr className="hover:bg-gray-100">
              <td className="w-[10%] text-center border">1</td>
              <td className="w-[20%] px-4 py-2 border">รูป</td>
              <td className="w-[30%] px-4 py-2 border">สมรักรักนะ</td>
              <td className="w-[20%] px-4 py-2 border">5 โพสต์</td>
              <td className="w-[20%] px-4 py-2 border">ดูรายละเอียด / บล็อค</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default EventControllers
