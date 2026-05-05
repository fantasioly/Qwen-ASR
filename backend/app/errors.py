from fastapi.responses import JSONResponse
from fastapi import HTTPException


def structured_error(error: str, message: str, code: int):
    raise HTTPException(
        status_code=code,
        detail={"error": error, "message": message, "code": code},
    )


def structured_error_response(error: str, message: str, code: int) -> JSONResponse:
    return JSONResponse(
        status_code=code,
        content={"error": error, "message": message, "code": code},
    )
