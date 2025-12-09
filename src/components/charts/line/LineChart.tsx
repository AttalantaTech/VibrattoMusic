import type React from "react";
import { Line } from "react-chartjs-2";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	Filler,
} from "chart.js";

// Registre os componentes necessários do Chart.js
ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	Filler
);

interface LineChartProps {
	dates: Array<string>;
	values: Array<number>;
	title?: string;
	lineColor?: string;
}

export const LineChartComponent: React.FC<LineChartProps> = ({
	dates,
	values,
	title = "Variação de Valores",
	lineColor = "#32D583",
}) => {
	// Validação básica dos dados
	if (dates.length !== values.length) {
		console.error("O número de datas e valores deve ser igual");
		return (
			<div className="text-red-500">Erro: Datas e valores não correspondem</div>
		);
	}

	const chartData = {
		labels: dates,
		datasets: [
			{
				label: "Valor (R$)",
				data: values,
				borderColor: lineColor,
				backgroundColor: `${lineColor}20`, // Adiciona transparência 20%
				tension: 0.4,
				fill: true,
				pointBackgroundColor: lineColor,
				pointBorderColor: "#fff",
				pointBorderWidth: 2,
				pointRadius: 5,
				pointHoverRadius: 7,
			},
		],
	};

	const options = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				display: false,
			},
			tooltip: {
				callbacks: {
					label: function (context: any) {
						return `R$ ${context.parsed.y.toLocaleString("pt-BR", {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						})}`;
					},
				},
			},
			title: {
				display: !!title,
				text: title,
				font: {
					size: 16,
				},
				padding: {
					top: 10,
					bottom: 20,
				},
			},
		},
		scales: {
			y: {
				beginAtZero: false,
				ticks: {
					callback: function (value: any) {
						return `R$ ${value.toLocaleString("pt-BR", {
							minimumFractionDigits: 0,
							maximumFractionDigits: 0,
						})}`;
					},
				},
				grid: {
					color: "rgba(0, 0, 0, 0.05)",
				},
			},
			x: {
				grid: {
					display: false,
				},
			},
		},
	};

	return (
		<div className="w-full h-80 bg-white rounded-lg shadow-sm p-4 flex justify-center items-center">
			{chartData.labels.length > 0 ? (
				<Line data={chartData} options={options} />
			) : (
				<div className="text-gray-600">
					Nenhum dado disponível para exibir o gráfico.
				</div>
			)}
		</div>
	);
};
