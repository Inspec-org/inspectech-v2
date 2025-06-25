"use client";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const DoughnutLoginChart = () => {
  const data = {
    labels: ["In App Login", "Google Login", "Apple Login"],
    datasets: [
      {
        data: [45, 35, 20],
        backgroundColor: [
          "#4F46E5", // In App Login (dark indigo)
          "#6366F1", // Google Login (light indigo)
          "#E5E7EB", // Apple Login (light gray)
        ],
        borderWidth: 0,
        cutout: "70%", // For doughnut thickness
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        display: false, // We'll use a custom legend
      },
    },
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 w-[390px]">
      <h4 className="text-sm font-semibold text-gray-900 mb-4">Users Logged In By</h4>
      <div className="flex flex-col items-center">
        <Doughnut data={data} options={options} />

        {/* Legend */}
        <div className="mt-4 flex gap-4 text-xs text-gray-700">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#4F46E5]"></span> In App Login
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#6366F1]"></span> Google Login
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#E5E7EB]"></span> Apple Login
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoughnutLoginChart;
