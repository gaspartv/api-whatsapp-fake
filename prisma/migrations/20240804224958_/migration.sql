-- CreateTable
CREATE TABLE "Convidados" (
    "id" SERIAL NOT NULL,
    "createdAt" DATE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATE,
    "nome" VARCHAR(100) NOT NULL,
    "phone" TEXT NOT NULL,
    "confirmed" BOOLEAN DEFAULT false,
    "presente" TEXT DEFAULT 'M',
    "acompanhantes" TEXT[],

    CONSTRAINT "Convidados_pkey" PRIMARY KEY ("id")
);
