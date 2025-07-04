import React from "react";

function HomePage() {
  return (
    <div className="flex flex-col ml-5 mr-5 mt-5">
      <div className="carousel w-full">
        <div id="slide1" className="carousel-item relative w-full">
          <img
            src="https://img.daisyui.com/images/stock/photo-1625726411847-8cbb60cc71e6.webp"
            className="w-full"
          />
          <div className="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between">
            <a href="#slide4" className="btn btn-circle">
              ❮
            </a>
            <a href="#slide2" className="btn btn-circle">
              ❯
            </a>
          </div>
        </div>
        <div id="slide2" className="carousel-item relative w-full">
          <img
            src="https://img.daisyui.com/images/stock/photo-1609621838510-5ad474b7d25d.webp"
            className="w-full"
          />
          <div className="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between">
            <a href="#slide1" className="btn btn-circle">
              ❮
            </a>
            <a href="#slide3" className="btn btn-circle">
              ❯
            </a>
          </div>
        </div>
        <div id="slide3" className="carousel-item relative w-full">
          <img
            src="https://img.daisyui.com/images/stock/photo-1414694762283-acccc27bca85.webp"
            className="w-full"
          />
          <div className="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between">
            <a href="#slide2" className="btn btn-circle">
              ❮
            </a>
            <a href="#slide4" className="btn btn-circle">
              ❯
            </a>
          </div>
        </div>
        <div id="slide4" className="carousel-item relative w-full">
          <img
            src="https://img.daisyui.com/images/stock/photo-1665553365602-b2fb8e5d1707.webp"
            className="w-full"
          />
          <div className="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between">
            <a href="#slide3" className="btn btn-circle">
              ❮
            </a>
            <a href="#slide1" className="btn btn-circle">
              ❯
            </a>
          </div>
        </div>
      </div>

      <div className="text-4xl font-bold mt-5">
        สถานที่ท่องเที่ยวเชิงวัฒนธรรมยอดนิยม 5 อันดับ
        <div className="flex flex-wrap mt-5 mr-5 ml-5">
          <div className="card bg-base-100 w-85 shadow-sm mt-3 mr-5">
            <figure>
              <img src="https://s.isanook.com/tr/0/ud/282/1412087/41463628_295061174416770_4443_1.jpg?ip/crop/w670h402/q80/jpg" />
            </figure>
            <div className="card-body">
              <div className="flex justify-end">
                <div className="badge bg-purple-600 text-base-100">
                  เชิงวัฒนธรรม
                </div>
              </div>
              <p>
                วิ่งขึ้นดอยสุเทพ
              </p>
            </div>
          </div>

          <div className="card bg-base-100 w-85 shadow-sm mt-3 mr-5">
            <figure>
              <img src="https://s.isanook.com/tr/0/ud/282/1412087/41463628_295061174416770_4443_1.jpg?ip/crop/w670h402/q80/jpg" />
            </figure>
            <div className="card-body">
              <div className="flex justify-end">
                <div className="badge bg-purple-600 text-base-100">
                  เชิงวัฒนธรรม
                </div>
              </div>
              <p>
                วัดห้วยปลากั้ง ตำบลริมกก อำเภอเมืองเชียง ราย
                จังหวัดเชียงราย.....
              </p>
            </div>
          </div>

          <div className="card bg-base-100 w-85 shadow-sm mt-3 mr-5">
            <figure>
              <img src="https://s.isanook.com/tr/0/ud/282/1412087/41463628_295061174416770_4443_1.jpg?ip/crop/w670h402/q80/jpg" />
            </figure>
            <div className="card-body">
              <div className="flex justify-end">
                <div className="badge bg-purple-600 text-base-100">
                  เชิงวัฒนธรรม
                </div>
              </div>
              <p>
                วัดห้วยปลากั้ง ตำบลริมกก อำเภอเมืองเชียง ราย
                จังหวัดเชียงราย.....
              </p>
            </div>
          </div>

          <div className="card bg-base-100 w-85 shadow-sm mt-3 mr-5">
            <figure>
              <img src="https://s.isanook.com/tr/0/ud/282/1412087/41463628_295061174416770_4443_1.jpg?ip/crop/w670h402/q80/jpg" />
            </figure>
            <div className="card-body">
              <div className="flex justify-end">
                <div className="badge bg-purple-600 text-base-100">
                  เชิงวัฒนธรรม
                </div>
              </div>
              <p>
                วัดห้วยปลากั้ง ตำบลริมกก อำเภอเมืองเชียง ราย
                จังหวัดเชียงราย.....
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-100 w-full h-120 mt-5">
        <div className="text-4xl font-bold text-center pt-5">
          กิจกรรมที่น่าสนใจ
        </div>

        <div className="flex flex-wrap  justify-center items-center">
          <div className="card bg-base-100 w-100 shadow-sm mt-3 mr-30">
            <figure>
              <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2vCKcDkjgZltD9Ngi7i8ISjjow0V251bLaw&s" />
            </figure>
            <div className="card-body">
              <div className="flex justify-end">
                <div className="badge bg-rose-600 text-base-100">
                  กิจกรรม
                </div>
              </div>
              <p>
                วัดห้วยปลากั้ง ตำบลริมกก อำเภอเมืองเชียง ราย
                จังหวัดเชียงราย.....
              </p>
            </div>
          </div>
          <div className="card bg-base-100 w-100 shadow-sm mt-3 mr-30">
            <figure>
              <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2vCKcDkjgZltD9Ngi7i8ISjjow0V251bLaw&s" />
            </figure>
            <div className="card-body">
              <div className="flex justify-end">
                <div className="badge bg-rose-600 text-base-100">
                  กิจกรรม
                </div>
              </div>
              <p>
                วิ่งขึ้นดอยสุเทพ
              </p>
            </div>
          </div>
          <div className="card bg-base-100 w-100 shadow-sm mt-3 mr-5">
            <figure>
              <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2vCKcDkjgZltD9Ngi7i8ISjjow0V251bLaw&s" />
            </figure>
            <div className="card-body">
              <div className="flex justify-end">
                <div className="badge bg-rose-600 text-base-100">
                  กิจกรรม
                </div>
              </div>
              <p>
                วิ่งขึ้นดอยสุเทพ
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="text-4xl font-bold ml-150">แนะนำ</div>

        <div className="flex justify-between mt-3 gap-4">
          <div className="flex flex-col gap-5">

            <div className="card lg:card-side bg-base-100 shadow-sm">
              <div className="flex flex-wrap w-300">
                <figure>
                  <img
                    src="https://image-tc.galaxy.tf/wijpeg-7pqufmqti0twcdzzq3btsb5lq/wat-rong-khun_standard.jpg?crop=0%2C0%2C555%2C416"
                  />
                </figure>
                <div className="card-body">
                  <h2 className="card-title">วัดรุ่งขุ่น</h2>
                  <p>วัดขาวสวยงาม</p>
                  <div className="card-actions">
                    <button className="btn btn-primary">Listen</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="card lg:card-side bg-base-100 shadow-sm">
              <div className="flex flex-wrap w-300">
                <figure>
                  <img
                    src="https://image-tc.galaxy.tf/wijpeg-7pqufmqti0twcdzzq3btsb5lq/wat-rong-khun_standard.jpg?crop=0%2C0%2C555%2C416"
                  />
                </figure>
                <div className="card-body">
                  <h2 className="card-title">วัดรุ่งขุ่น</h2>
                  <p>วัดขาวสวยงาม</p>
                  <div className="card-actions">
                    <button className="btn btn-primary">Listen</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="card lg:card-side bg-base-100 shadow-sm">
              <div className="flex flex-wrap w-300">
                <figure>
                  <img
                    src="https://image-tc.galaxy.tf/wijpeg-7pqufmqti0twcdzzq3btsb5lq/wat-rong-khun_standard.jpg?crop=0%2C0%2C555%2C416"
                  />
                </figure>
                <div className="card-body">
                  <h2 className="card-title">วัดรุ่งขุ่น</h2>
                  <p>วัดขาวสวยงาม</p>
                  <div className="card-actions">
                    <button className="btn btn-primary">Listen</button>
                  </div>
                </div>
              </div>
            </div>


          </div>

          <div className="card bg-base-100 shadow-sm w-100">
            <div className="card-header text-2xl font-bold m-3">
              สินค้าแนะนำ
            </div>
            <div className="card-body">
              <figure>
                <img
                  src="https://i.ytimg.com/vi/Dz5VwiqGmuw/maxresdefault.jpg"
                />
              </figure>
              <div className="flex justify-end">
                <div className="badge bg-green-500 text-base-100">สินค้า</div>
              </div>
              <p>หอมหวาน</p>
            </div>
            <div className="card-body">
              <figure>
                <img
                  src="https://i.ytimg.com/vi/Dz5VwiqGmuw/maxresdefault.jpg"
                />
              </figure>
              <div className="flex justify-end">
                <div className="badge bg-green-500 text-base-100">สินค้า</div>
              </div>
              <p>หอมหวาน</p>
            </div>
            <div className="card-body">
              <figure>
                <img
                  src="https://i.ytimg.com/vi/Dz5VwiqGmuw/maxresdefault.jpg"
                />
              </figure>
              <div className="flex justify-end">
                <div className="badge bg-green-500 text-base-100">สินค้า</div>
              </div>
              <p>หอมหวาน</p>
            </div>

            <div className="card-body">
              <figure>
                <img
                  src="https://i.ytimg.com/vi/Dz5VwiqGmuw/maxresdefault.jpg"
                />
              </figure>
              <div className="flex justify-end">
                <div className="badge bg-green-500 text-base-100">สินค้า</div>
              </div>
              <p>หอมหวาน</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
