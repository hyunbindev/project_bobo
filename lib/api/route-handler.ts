import { ApiError, BadRequestError } from "@/lib/api/errors";
import { logger } from "@/lib/logger";

type RouteContext = Record<string, unknown>;

type ApiRouteHandler<TContext extends RouteContext = RouteContext> = (
  request: Request,
  context: TContext,
) => Response | Promise<Response>;

export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    // JSON 파싱 실패만 400으로 바꾸고 서비스 내부의 SyntaxError와 섞지 않는다.
    throw new BadRequestError("Request body must be valid JSON.");
  }
}

export function withApiErrorHandler<TContext extends RouteContext = RouteContext>(
  handler: ApiRouteHandler<TContext>,
): ApiRouteHandler<TContext> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof ApiError) {
        return Response.json(
          {
            error: {
              code: error.code,
              message: error.message,
            },
          },
          { status: error.status, headers: error.headers },
        );
      }

      logger.error(
        {
          err: error,
          event: "api.unhandled_error",
          method: request.method,
          pathname: new URL(request.url).pathname,
        },
        "Unhandled API error",
      );

      return Response.json(
        {
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Unexpected server error.",
          },
        },
        { status: 500 },
      );
    }
  };
}
