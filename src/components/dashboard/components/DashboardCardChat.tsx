"use client";
import { useUser } from "@/app/context/UserContext";
import { useState, useEffect } from "react";
// import { ApexOptions } from "apexcharts";
import Image from "next/image";
import React from "react";
// import ReactApexChart from "react-apexcharts";
const ChartThree: React.FC = () => {
  const user = useUser();

  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const pad = (num: number) => num.toString().padStart(2, '0'); // Pad with leading zero

    const updateTime = () => {
      const now = new Date();
      const formattedTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      setTime(formattedTime);
    };

    updateTime(); // Initialize immediately
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval); // Cleanup
  }, []);

  return (
    <div className="col-span-12 rounded-lg border border-stroke bg-white px-5 pb-5 pt-7.5 shadow-default dark:border-[#181818] dark:bg-[#181818] sm:px-7.5 xl:col-span-5">
      <div className="mb-3 justify-between gap-4 sm:flex">
        <div>
          <h5 className="text-xl font-semibold text-black dark:text-white">
            Collaborate with team
          </h5>
        </div>
      </div>

      <div className="mb-2">
        <div id="chartThree" className="mx-auto flex justify-center">
          <div className="flex items-start gap-2.5">
            {user && (
              <>
                <Image
                  className="rounded-full"
                  src={user.photo}
                  alt="Jese image"
                  width={32}
                  height={32}
                  layout="intrinsic"  // Adjusts the image size automatically
                />


                <div className="leading-1.5 border-gray-200 dark:bg-gray-700 flex w-full max-w-[320px] flex-col rounded-e-xl rounded-es-xl bg-[#f3f4f6] p-4">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <span className="text-gray-900 text-sm font-semibold dark:text-white">
                      {user.firstName}{" "}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm font-normal">
                      {time}
                    </span>
                  </div>
                  <p className="text-gray-900 py-2.5 text-sm font-normal dark:text-white">
                    That&apos;s awesome. I think we are making a pretty good progress
                  </p>
                  <span className="text-gray-500 dark:text-gray-400 text-sm font-normal">
                    Delivered
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartThree;
