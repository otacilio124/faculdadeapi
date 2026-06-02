import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth, requireScope } from "@/lib/auth";

const MAX_BYTES = 4 * 1024 * 1024; // 4MB — limite de corpo do serverless no Vercel
const TIPOS_PERMITIDOS = ["application/pdf", "image/jpeg", "image/png"];

/**
 * Cria um atestado COM arquivo anexo, recebendo multipart/form-data.
 * Campos do formulário: arquivo (File), usuarioId, periodo, motivo, cronogramaId?
 * O binário é guardado na tabela ArquivoAtestado (coluna bytea no Neon).
 */
export async function POST(request: NextRequest) {
  const auth = await getAuth(request);
  const err = requireScope(auth, "atestados:write");
  if (err) return err;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "envie os dados como multipart/form-data" },
      { status: 400 }
    );
  }

  const file = form.get("arquivo");
  const usuarioId = Number(form.get("usuarioId"));
  const periodo = String(form.get("periodo") ?? "").trim();
  const motivo = String(form.get("motivo") ?? "").trim();
  const cronogramaIdRaw = form.get("cronogramaId");

  // Validação dos campos
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "campo 'arquivo' é obrigatório" }, { status: 422 });
  }
  if (!usuarioId || !periodo || !motivo) {
    return NextResponse.json(
      { error: "usuarioId, periodo e motivo são obrigatórios" },
      { status: 422 }
    );
  }

  // Validação do arquivo
  if (file.size === 0) {
    return NextResponse.json({ error: "arquivo vazio" }, { status: 422 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "arquivo excede o limite de 4MB" },
      { status: 413 }
    );
  }
  if (!TIPOS_PERMITIDOS.includes(file.type)) {
    return NextResponse.json(
      { error: "tipo não permitido — envie PDF, JPG ou PNG" },
      { status: 415 }
    );
  }

  const conteudo = new Uint8Array(await file.arrayBuffer());

  try {
    const atestado = await prisma.atestado.create({
      data: {
        usuarioId,
        periodo,
        motivo,
        cronogramaId: cronogramaIdRaw ? Number(cronogramaIdRaw) : null,
        arquivo: {
          create: {
            nome: file.name,
            tipo: file.type,
            tamanho: file.size,
            conteudo,
          },
        },
      },
      include: {
        usuario: { select: { id: true, nome: true, email: true } },
      },
    });

    // Retorna o atestado + metadados do arquivo (sem o binário)
    return NextResponse.json(
      {
        ...atestado,
        arquivo: {
          nome: file.name,
          tipo: file.type,
          tamanho: file.size,
          url: `/api/atestados/${atestado.id}/arquivo`,
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "usuário não encontrado ou dados inválidos" },
      { status: 422 }
    );
  }
}
