import Chart from "chart.js/auto";

export const createChartImage = ({
  type = "bar",
  title,
  labels,
  data,
}) => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");

    canvas.width = 900;
    canvas.height = 500;

    const ctx = canvas.getContext("2d");

    new Chart(ctx, {
      type,

      data: {
        labels,

        datasets: [
          {
            label: title,
            data,
            backgroundColor: [
              "#2563eb",
              "#16a34a",
              "#f59e0b",
              "#dc2626",
              "#9333ea",
            ],
          },
        ],
      },

      options: {
        responsive: false,

        animation: {
          onComplete() {
            resolve(canvas.toDataURL("image/png"));
          },
        },

        plugins: {
          legend: {
            display: false,
          },

          title: {
            display: true,
            text: title,
            font: {
              size: 18,
            },
          },
        },

        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
            },
          },
        },
      },
    });
  });
};