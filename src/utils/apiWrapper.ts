const API_KEY = "v10gv2f4vdfhbtymhsdfvweuyv678gv8erh";

export function buildRequestBody(data: object) {
  return {
    api_key: API_KEY,
    data,
  };
}
