-- CreateTable
CREATE TABLE "ArquivoAtestado" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "conteudo" BYTEA NOT NULL,
    "atestadoId" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArquivoAtestado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArquivoAtestado_atestadoId_key" ON "ArquivoAtestado"("atestadoId");

-- AddForeignKey
ALTER TABLE "ArquivoAtestado" ADD CONSTRAINT "ArquivoAtestado_atestadoId_fkey" FOREIGN KEY ("atestadoId") REFERENCES "Atestado"("id") ON DELETE CASCADE ON UPDATE CASCADE;
