import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { format } from "fast-csv";
import ExcelJS from "exceljs";

const prisma = new PrismaClient();

export const exportFlightData = async (req: Request, res: Response) => {
  const {
    format: fileFormat,
    airportCodes,
    minAlt,
    maxAlt,
    columns,
    startDate,
    endDate,
  } = req.body;

  if (!columns || !Array.isArray(columns) || columns.length === 0) {
    return res
      .status(400)
      .json({ message: "Wajib memilih minimal satu kolom." });
  }

  const exportType = fileFormat === "excel" ? "excel" : "csv";

  const pointFields = [
    "flightId",
    "lat",
    "lon",
    "alt",
    "gspeed",
    "vspeed",
    "squawk",
    "track",
    "timestamp",
  ];
  const flightFields = ["callsign", "hex", "source", "fr24_id"];
  const needFlightRelation = columns.some((col) => flightFields.includes(col));

  try {
    const whereConditions: any[] = [];

    if (startDate && endDate) {
      whereConditions.push({
        timestamp: { gte: new Date(startDate), lte: new Date(endDate) },
      });
    }

    if (minAlt !== undefined || maxAlt !== undefined) {
      whereConditions.push({
        alt: {
          gte: minAlt ? Number(minAlt) : 0,
          lte: maxAlt ? Number(maxAlt) : 100000,
        },
      });
    }

    if (
      airportCodes &&
      Array.isArray(airportCodes) &&
      airportCodes.length > 0
    ) {
      const airports = await prisma.airport.findMany({
        where: { code: { in: airportCodes } },
      });
      if (airports.length > 0) {
        const locationFilters = airports.map((airport) => {
          const [north, south, west, east] = airport.bounds
            .split(",")
            .map(Number);
          return {
            lat: { gte: south, lte: north },
            lon: { gte: west, lte: east },
          };
        });
        whereConditions.push({ OR: locationFilters });
      }
    }

    const finalWhereClause =
      whereConditions.length > 0 ? { AND: whereConditions } : {};

    let csvStream: any = null;
    let excelWorkbook: any = null;
    let excelWorksheet: any = null;

    if (exportType === "csv") {
      const filename = `aerotrack_export_${Date.now()}.csv`;
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

      csvStream = format({ headers: true });
      csvStream.pipe(res);
    } else {
      const filename = `aerotrack_export_${Date.now()}.xlsx`;
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

      excelWorkbook = new ExcelJS.stream.xlsx.WorkbookWriter({
        stream: res,
        useStyles: false,
      });
      excelWorksheet = excelWorkbook.addWorksheet("Data Penerbangan");

      excelWorksheet.columns = columns.map((col) => ({
        header: col.toUpperCase(),
        key: col,
        width: 15,
      }));
    }

    const BATCH_SIZE = 5000;
    let cursor: bigint | undefined = undefined;
    let hasMore = true;

    while (hasMore) {
      const batch: any[] = await prisma.flightPoint.findMany({
        take: BATCH_SIZE,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        where: finalWhereClause,
        include: needFlightRelation ? { flight: true } : undefined,
      });

      if (batch.length === 0) {
        hasMore = false;
        break;
      }

      cursor = batch[batch.length - 1].id;

      batch.forEach((row: any) => {
        const rowData: any = {};

        columns.forEach((col: string) => {
          if (pointFields.includes(col)) {
            if (col === "timestamp") {
              rowData[col] =
                exportType === "excel"
                  ? row.timestamp
                  : row.timestamp.toISOString();
            } else {
              rowData[col] = row[col];
            }
          } else if (flightFields.includes(col) && row.flight) {
            // Backend akan mengambil row.flight.flightId dan memasukkannya ke Excel
            rowData[col] = row.flight[col];
          }
        });

        if (exportType === "csv") {
          csvStream.write(rowData);
        } else {
          excelWorksheet.addRow(rowData).commit();
        }
      });

      if (batch.length < BATCH_SIZE) hasMore = false;
    }

    if (exportType === "csv") {
      csvStream.end();
    } else {
      excelWorksheet.commit();
      await excelWorkbook.commit();
    }
  } catch (error) {
    console.error("Export Error:", error);
    if (!res.headersSent) res.status(500).json({ error: "Gagal export data" });
  }
};
