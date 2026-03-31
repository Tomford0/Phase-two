-- AlterTable: replace address with latitude/longitude on Hospital
ALTER TABLE "Hospital" ADD COLUMN "latitude" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Hospital" ADD COLUMN "longitude" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Hospital" DROP COLUMN "address";
