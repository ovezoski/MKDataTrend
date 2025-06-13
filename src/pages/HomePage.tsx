import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { BarChart, LineChart, PieChart } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-white p-8 sm:p-12 md:p-16 lg:p-20">
      <h1 className="mb-8 text-center text-3xl font-extrabold text-gray-900 sm:mb-10 sm:text-4xl md:text-5xl">
        Macedonian Statistics Visualizations
      </h1>

      <div className="grid w-full max-w-6xl grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-opacity-90 w-full rounded-lg bg-white shadow-lg transition-shadow duration-300 hover:shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold text-blue-700">
              <BarChart className="h-6 w-6 text-blue-600" />
              Population Trends
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-gray-600">
              Interactive charts on demographic changes.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-base leading-relaxed text-gray-700">
            <p className="mb-2">
              Explore the historical and projected population data for
              Macedonia.
            </p>
            <p>
              Understand growth rates, age distribution, and migration patterns.
            </p>
          </CardContent>
          <CardFooter className="flex justify-end pt-4">
            <span className="cursor-pointer text-sm text-gray-500 hover:underline">
              View Visualization
            </span>
          </CardFooter>
        </Card>

        <Card className="bg-opacity-90 w-full rounded-lg bg-white shadow-lg transition-shadow duration-300 hover:shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold text-green-700">
              <LineChart className="h-6 w-6 text-green-600" />
              Economic Indicators
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-gray-600">
              Key economic statistics over time.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-base leading-relaxed text-gray-700">
            <p className="mb-2">
              Visualize GDP, inflation, unemployment rates, and more.
            </p>
            <p>
              Analyze economic performance and identify trends affecting the
              region.
            </p>
          </CardContent>
          <CardFooter className="flex justify-end pt-4">
            <span className="cursor-pointer text-sm text-gray-500 hover:underline">
              Explore Data
            </span>
          </CardFooter>
        </Card>

        <Card className="bg-opacity-90 w-full rounded-lg bg-white shadow-lg transition-shadow duration-300 hover:shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold text-purple-700">
              <PieChart className="h-6 w-6 text-purple-600" />
              Sectoral Distribution
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-gray-600">
              Breakdown of various sectors.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-base leading-relaxed text-gray-700">
            <p className="mb-2">
              Understand the contribution of different sectors to the economy.
            </p>
            <p>
              View visual breakdowns of agriculture, industry, and services.
            </p>
          </CardContent>
          <CardFooter className="flex justify-end pt-4">
            <span className="cursor-pointer text-sm text-gray-500 hover:underline">
              See Details
            </span>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
