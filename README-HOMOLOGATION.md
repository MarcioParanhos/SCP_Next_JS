Homologação / Auditoria - Instruções

1) Sincronizar o esquema Prisma com o banco de dados

  - Atualizamos `prisma/schema.prisma` adicionando o modelo `Homologation`.
  - Para aplicar a migração localmente execute:

```bash
npx prisma migrate dev --name add-homologation
```

2) Gerar Prisma Client (normalmente `migrate dev` já faz isso)

```bash
npx prisma generate
```

3) Executar a aplicação em desenvolvimento

```bash
npm run dev
```

4) Testar as rotas

  - Listar histórico: GET `/api/school_units/:id/homologations`
  - Registrar ação: POST `/api/school_units/:id/homologations` com body JSON:

```json
{ "action": "HOMOLOGATED", "reason": "Motivo...", "performed_by": "user-id" }
```

Observações:
 - A migração deve ser executada localmente; este repositório não aplica migrações automaticamente.
 - Caso use um servidor de CI/CD, adicione passos para executar as migrações no deploy.
