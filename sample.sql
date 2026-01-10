/*
PostgreSQL Backup
Database: sample/public

*/

DROP TABLE IF EXISTS "public"."accounts";
DROP TABLE IF EXISTS "public"."orders";
DROP TABLE IF EXISTS "public"."products";
DROP TABLE IF EXISTS "public"."sales_records";
DROP TABLE IF EXISTS "public"."users";
CREATE TABLE "accounts" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "type" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "provider" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "provider_account_id" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "refresh_token" varchar COLLATE "pg_catalog"."default",
  "access_token" varchar COLLATE "pg_catalog"."default",
  "expires_at" int4,
  "token_type" varchar(50) COLLATE "pg_catalog"."default",
  "scope" varchar COLLATE "pg_catalog"."default",
  "id_token" text COLLATE "pg_catalog"."default",
  "session_state" varchar COLLATE "pg_catalog"."default"
)
;
ALTER TABLE "accounts" OWNER TO "postgres";
CREATE TABLE "orders" (
  "order_id" int4 NOT NULL DEFAULT nextval('orders_order_id_seq'::regclass),
  "customer_id" int4 NOT NULL,
  "order_date" date NOT NULL DEFAULT CURRENT_DATE,
  "total_amount" numeric(10,2) NOT NULL,
  "status" varchar(20) COLLATE "pg_catalog"."default" NOT NULL
)
;
ALTER TABLE "orders" OWNER TO "postgres";
COMMENT ON TABLE "orders" IS '订单表';
CREATE TABLE "products" (
  "product_id" int4 NOT NULL DEFAULT nextval('products_product_id_seq'::regclass),
  "product_name" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "price" numeric(10,2) NOT NULL
)
;
ALTER TABLE "products" OWNER TO "postgres";
COMMENT ON TABLE "products" IS '产品表';
CREATE TABLE "sales_records" (
  "sale_id" int4 NOT NULL DEFAULT nextval('sales_records_sale_id_seq'::regclass),
  "product_id" int4 NOT NULL,
  "sale_date" date NOT NULL DEFAULT CURRENT_DATE,
  "quantity" int4 NOT NULL,
  "total_amount" numeric(10,2) NOT NULL
)
;
ALTER TABLE "sales_records" OWNER TO "postgres";
COMMENT ON TABLE "sales_records" IS '销售记录';
CREATE TABLE "users" (
  "id" int4 NOT NULL,
  "name" varchar(255) COLLATE "pg_catalog"."default",
  "fullname" varchar(255) COLLATE "pg_catalog"."default"
)
;
ALTER TABLE "users" OWNER TO "postgres";
BEGIN;
LOCK TABLE "public"."accounts" IN SHARE MODE;
DELETE FROM "public"."accounts";
INSERT INTO "public"."accounts" ("id","user_id","type","provider","provider_account_id","refresh_token","access_token","expires_at","token_type","scope","id_token","session_state") VALUES ('45fe066e-18e3-456b-b4cf-cab39c98a715', '45fe066e-18e3-456b-b4cf-cab39c98a715', '2', '2', '2', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
;
COMMIT;
BEGIN;
LOCK TABLE "public"."orders" IN SHARE MODE;
DELETE FROM "public"."orders";
INSERT INTO "public"."orders" ("order_id","customer_id","order_date","total_amount","status") VALUES (1, 3, '2026-01-09', 741.55, '未支付'),(2, 2, '2026-01-09', 631.23, '已取消'),(3, 5, '2026-01-09', 848.35, '已取消'),(4, 15, '2026-01-09', 378.61, '未支付'),(5, 7, '2026-01-09', 862.30, '未支付'),(6, 9, '2026-01-09', 897.91, '未支付'),(7, 15, '2026-01-09', 213.55, '已支付'),(8, 6, '2026-01-09', 243.03, '已支付'),(9, 1, '2026-01-09', 216.57, '已取消'),(10, 18, '2026-01-09', 466.32, '已支付'),(11, 16, '2026-01-09', 615.02, '未支付'),(12, 2, '2026-01-09', 242.50, '已取消'),(13, 5, '2026-01-09', 606.28, '已支付'),(14, 10, '2026-01-09', 96.54, '已支付'),(15, 5, '2026-01-09', 36.83, '未支付'),(16, 17, '2026-01-09', 718.46, '已取消'),(17, 2, '2026-01-09', 980.79, '已支付'),(18, 2, '2026-01-09', 174.59, '已支付'),(19, 4, '2026-01-09', 615.64, '未支付'),(20, 20, '2026-01-09', 864.80, '未支付'),(21, 19, '2026-01-09', 200.91, '未支付'),(22, 4, '2026-01-09', 239.04, '已支付'),(23, 9, '2026-01-09', 305.76, '未支付'),(24, 3, '2026-01-09', 281.12, '已取消'),(25, 11, '2026-01-09', 323.89, '已支付'),(26, 15, '2026-01-09', 54.07, '未支付'),(27, 11, '2026-01-09', 907.90, '已取消'),(28, 8, '2026-01-09', 369.94, '已支付'),(29, 3, '2026-01-09', 53.52, '未支付'),(30, 3, '2026-01-09', 479.99, '已取消'),(31, 10, '2026-01-09', 485.54, '已支付'),(32, 4, '2026-01-09', 520.94, '已取消'),(33, 10, '2026-01-09', 459.13, '已支付'),(34, 4, '2026-01-09', 262.20, '已支付'),(35, 13, '2026-01-09', 776.79, '已支付'),(36, 16, '2026-01-09', 564.67, '已支付'),(37, 2, '2026-01-09', 213.13, '已支付'),(38, 18, '2026-01-09', 557.10, '未支付'),(39, 11, '2026-01-09', 352.86, '已取消'),(40, 5, '2026-01-09', 98.17, '已取消'),(41, 18, '2026-01-09', 719.35, '未支付'),(42, 4, '2026-01-09', 537.25, '已支付'),(43, 20, '2026-01-09', 113.78, '已取消'),(44, 4, '2026-01-09', 475.14, '未支付'),(45, 9, '2026-01-09', 521.84, '已支付'),(46, 9, '2026-01-09', 291.74, '已取消'),(47, 1, '2026-01-09', 471.39, '已取消'),(48, 8, '2026-01-09', 919.05, '已取消'),(49, 7, '2026-01-09', 533.16, '未支付'),(50, 7, '2026-01-09', 861.54, '未支付'),(51, 15, '2026-01-09', 61.57, '未支付'),(52, 9, '2026-01-09', 348.17, '未支付'),(53, 10, '2026-01-09', 67.79, '未支付'),(54, 9, '2026-01-09', 502.23, '未支付'),(55, 19, '2026-01-09', 626.84, '未支付'),(56, 2, '2026-01-09', 155.77, '已支付'),(57, 20, '2026-01-09', 724.41, '已支付'),(58, 14, '2026-01-09', 126.29, '未支付'),(59, 20, '2026-01-09', 765.84, '已取消'),(60, 16, '2026-01-09', 13.60, '已取消'),(61, 2, '2026-01-09', 316.89, '已支付'),(62, 17, '2026-01-09', 511.87, '已取消'),(63, 15, '2026-01-09', 47.63, '已支付'),(64, 5, '2026-01-09', 703.20, '已取消'),(65, 3, '2026-01-09', 811.32, '未支付'),(66, 7, '2026-01-09', 501.21, '未支付'),(67, 17, '2026-01-09', 724.52, '已取消'),(68, 5, '2026-01-09', 823.69, '已取消'),(69, 4, '2026-01-09', 666.76, '已支付'),(70, 9, '2026-01-09', 716.87, '未支付'),(71, 6, '2026-01-09', 779.46, '未支付'),(72, 8, '2026-01-09', 509.57, '已支付'),(73, 5, '2026-01-09', 150.38, '已取消'),(74, 1, '2026-01-09', 777.97, '未支付'),(75, 9, '2026-01-09', 981.79, '已取消'),(76, 3, '2026-01-09', 443.32, '已取消'),(77, 5, '2026-01-09', 426.47, '未支付'),(78, 4, '2026-01-09', 490.92, '未支付'),(79, 20, '2026-01-09', 794.82, '已支付'),(80, 12, '2026-01-09', 783.24, '未支付'),(81, 18, '2026-01-09', 641.59, '未支付'),(82, 6, '2026-01-09', 200.20, '未支付'),(83, 1, '2026-01-09', 146.20, '已支付'),(84, 20, '2026-01-09', 834.87, '已取消'),(85, 3, '2026-01-09', 816.30, '已支付'),(86, 19, '2026-01-09', 183.35, '已支付'),(87, 13, '2026-01-09', 713.75, '已取消'),(88, 17, '2026-01-09', 277.00, '已取消'),(89, 10, '2026-01-09', 328.23, '未支付'),(90, 16, '2026-01-09', 893.22, '未支付'),(91, 2, '2026-01-09', 637.12, '已取消'),(92, 13, '2026-01-09', 384.48, '未支付'),(93, 9, '2026-01-09', 211.39, '已取消'),(94, 7, '2026-01-09', 642.23, '未支付'),(95, 18, '2026-01-09', 253.41, '已取消'),(96, 12, '2026-01-09', 432.28, '已支付'),(97, 6, '2026-01-09', 505.07, '已取消'),(98, 8, '2026-01-09', 361.10, '未支付'),(99, 3, '2026-01-09', 508.43, '已取消'),(100, 16, '2026-01-09', 75.16, '已支付')
;
COMMIT;
BEGIN;
LOCK TABLE "public"."products" IN SHARE MODE;
DELETE FROM "public"."products";
INSERT INTO "public"."products" ("product_id","product_name","price") VALUES (1, '123', 213.00),(51, 'iPhone 15', 799.99),(52, 'Samsung Galaxy S24', 849.99),(53, 'MacBook Pro 14"', 1999.00),(54, 'Dell XPS 13', 1299.99),(55, 'Sony WH-1000XM5 Headphones', 399.99),(56, 'Apple Watch Series 9', 429.99),(57, 'iPad Air', 599.99)
;
COMMIT;
BEGIN;
LOCK TABLE "public"."sales_records" IN SHARE MODE;
DELETE FROM "public"."sales_records";
INSERT INTO "public"."sales_records" ("sale_id","product_id","sale_date","quantity","total_amount") VALUES (15, 51, '2026-01-05', 52, 1599.98),(16, 52, '2026-01-06', 51, 849.99),(17, 53, '2026-01-07', 51, 1999.00),(18, 51, '2026-01-08', 53, 2399.97),(19, 55, '2026-01-08', 52, 799.98),(20, 56, '2026-01-09', 51, 429.99),(21, 54, '2026-01-09', 51, 1299.99)
;
COMMIT;
BEGIN;
LOCK TABLE "public"."users" IN SHARE MODE;
DELETE FROM "public"."users";
INSERT INTO "public"."users" ("id","name","fullname") VALUES (1, 'kkk', NULL),(6, 'kkk777', NULL)
;
COMMIT;
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("id");
ALTER TABLE "orders" ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("order_id");
ALTER TABLE "products" ADD CONSTRAINT "products_pkey" PRIMARY KEY ("product_id");
ALTER TABLE "sales_records" ADD CONSTRAINT "sales_records_pkey" PRIMARY KEY ("sale_id");
ALTER TABLE "users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");
ALTER TABLE "sales_records" ADD CONSTRAINT "sales_records_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products" ("product_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
