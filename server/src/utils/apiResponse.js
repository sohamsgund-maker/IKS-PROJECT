export class ApiResponse {
  static success(res, data, { pagination = null, meta = {}, statusCode = 200 } = {}) {
    const response = {
      success: true,
      data,
    };

    if (pagination) {
      response.pagination = pagination;
    }

    if (Object.keys(meta).length > 0) {
      response.meta = meta;
    }

    return res.status(statusCode).json(response);
  }
}
