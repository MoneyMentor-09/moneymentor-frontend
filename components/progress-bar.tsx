import React from "react"

interface ProgressBarProps {
  percentage: number
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ percentage }) => {
  const status =
    percentage >= 100
      ? { status: "over", color: "#ef4444" } // red
      : percentage >= 80
      ? { status: "warning", color: "#facc15" } // yellow
      : { status: "good", color: "#22c55e" } // green

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Progress</span>
        <span
          className={`font-medium ${
            status.status === "over"
              ? "text-red-600"
              : status.status === "warning"
              ? "text-yellow-600"
              : "text-green-600"
          }`}
        >
          {percentage.toFixed(1)}%
        </span>
      </div>

      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-2 rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: status.color,
            transition: "width 1s ease-in-out",
          }}
        />
      </div>
    </div>
  )
}
