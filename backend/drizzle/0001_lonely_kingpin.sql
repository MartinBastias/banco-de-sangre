CREATE TABLE "donantes" (
	"rut" text PRIMARY KEY NOT NULL,
	"fecha_creacion" timestamp with time zone DEFAULT now()
);
