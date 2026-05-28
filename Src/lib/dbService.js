// Small Supabase data helpers used by the monolithic App while the codebase is
// being split into maintainable feature services.

export async function readRows(client, table, options = {}) {
  const { columns = "*", limit, order } = options;
  let query = client.from(table).select(columns);

  if (order) {
    const config = typeof order === "string" ? { column: order } : order;
    query = query.order(config.column, { ascending: config.ascending ?? true });
  }

  if (limit) query = query.limit(limit);
  return query;
}

export async function readFirstAvailableTable(client, tables, options = {}) {
  const { limit = 100 } = options;
  for (const table of tables) {
    const result = await readRows(client, table, { limit });
    if (!result.error) return result;
  }
  return { data: [], error: null };
}

export async function callProcedure(client, procedureName, params = {}) {
  return client.rpc(procedureName, params);
}

export function isProcedureUnavailable(error) {
  const code = String(error?.code || "");
  const message = String(error?.message || "").toLowerCase();
  return (
    code === "PGRST202" ||
    code === "PGRST204" ||
    message.includes("could not find the function") ||
    message.includes("schema cache") ||
    message.includes("not a function")
  );
}
