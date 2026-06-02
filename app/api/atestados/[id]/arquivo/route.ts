import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth, requireScope } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Faz o download do arquivo de um atestado.
 * Retorna o binário com o Content-Type correto para o navegador exibir/baixar.
 * Use ?download=1 para forçar o download em vez de abrir inline.
 */
export async function GET(request: NextRequest, { params }: Ctx) {
  const auth = await getAuth(request);
  const err = requireScope(auth, "atestados:read");
  if (err) return err;

  const { id } = await params;
  const arquivo = await prisma.arquivoAtestado.findUnique({
    where: { atestadoId: Number(id) },
  });

  if (!arquivo) {
    return NextResponse.json(
      { error: "este atestado não possui arquivo anexo" },
      { status: 404 }
    );
  }

  const forcarDownload = new URL(request.url).searchParams.get("download") === "1";
  const disposition = forcarDownload ? "attachment" : "inline";

  return new NextResponse(new Uint8Array(arquivo.conteudo), {
    headers: {
      "Content-Type": arquivo.tipo,
      "Content-Disposition": `${disposition}; filename="${arquivo.nome}"`,
      "Content-Length": String(arquivo.tamanho),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
