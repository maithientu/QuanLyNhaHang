"use client";

import { Table, Area } from "@/lib/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";

interface TableOverviewProps {
  tables: (Table & { area?: Area })[];
  areas: Area[];
}

const statusConfig = {
  available: { label: "Trống", className: "bg-status-available text-white" },
  occupied: { label: "Có khách", className: "bg-status-occupied text-white" },
  reserved: { label: "Đã đặt", className: "bg-status-reserved text-white" },
  cleaning: {
    label: "Dọn dẹp",
    className: "bg-status-cleaning text-foreground",
  },
};

export function TableOverview({ tables, areas }: TableOverviewProps) {
  // Lọc danh sách bàn theo từng khu vực để hiển thị trong tab
  const getTablesByArea = (areaId: string) => {
    return tables.filter((table) => table.area_id === areaId);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Sơ đồ bàn theo khu vực</CardTitle>
            <p className="text-sm text-muted-foreground">
              Nhấn vào từng khu vực để xem số bàn và trạng thái hiện tại.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {Object.entries(statusConfig).map(([key, config]) => (
              <div key={key} className="flex items-center gap-2">
                <span
                  className={cn("h-3 w-3 rounded-full", config.className)}
                />
                <span>{config.label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={areas[0]?.id} className="w-full">
          {/* Điều hướng giữa các khu vực khác nhau */}
          <TabsList className="mb-4 w-full justify-start overflow-auto">
            {areas.map((area) => (
              <TabsTrigger key={area.id} value={area.id} className="text-sm">
                {area.name}
                <Badge variant="secondary" className="ml-2">
                  {getTablesByArea(area.id).length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Lưới bàn hiển thị trạng thái, sức chứa và tên */}
          {areas.map((area) => (
            <TabsContent key={area.id} value={area.id}>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {getTablesByArea(area.id).map((table) => (
                  <div
                    key={table.id}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 rounded-3xl border-2 p-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-sm cursor-pointer",
                      table.status === "available" &&
                        "border-status-available bg-status-available/10 hover:bg-status-available/20",
                      table.status === "occupied" &&
                        "border-status-occupied bg-status-occupied/10 hover:bg-status-occupied/20",
                      table.status === "reserved" &&
                        "border-status-reserved bg-status-reserved/10 hover:bg-status-reserved/20",
                      table.status === "cleaning" &&
                        "border-status-cleaning bg-status-cleaning/10 hover:bg-status-cleaning/20",
                    )}
                  >
                    <span className="text-base font-semibold">
                      {table.name}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{table.capacity} chỗ</span>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "mt-2 text-xs",
                        statusConfig[table.status].className,
                      )}
                    >
                      {statusConfig[table.status].label}
                    </Badge>
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
