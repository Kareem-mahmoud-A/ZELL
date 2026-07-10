import * as admin from "firebase-admin";

export interface QueryOptions {
  limit?: number;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
  startAfter?: any;
  where?: { field: string; operator: admin.firestore.WhereFilterOp; value: any }[];
}

export class QueryBuilder {
  public static build(
    baseQuery: admin.firestore.Query,
    options: QueryOptions
  ): admin.firestore.Query {
    let query = baseQuery;

    if (options.where) {
      options.where.forEach((filter) => {
        query = query.where(filter.field, filter.operator, filter.value);
      });
    }

    if (options.orderBy) {
      query = query.orderBy(options.orderBy, options.orderDirection || "asc");
    }

    if (options.startAfter) {
      query = query.startAfter(options.startAfter);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    return query;
  }
}
