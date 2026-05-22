from pydantic import BaseModel, Field, create_model
from typing import ClassVar, Literal

class RinkuError(Exception):
  _schema: ClassVar[type[BaseModel] | None] = None

  def __init__(
    self,
    message: str, 
    status_code: int = 500,
  ):
      super().__init__(message)
      self.message = message
      self.status_code = status_code

  @classmethod
  def schema(cls) -> type[BaseModel]:
     if cls._schema is not None:
        return cls._schema
     
     error_literal = Literal[cls.__name__]

     model = create_model(
        cls.__name__,
        error=(error_literal, Field(examples=[cls.__name__])),
        detail=(str, ...)
     )

     cls._schema = model

     return cls._schema

class Unauthorized(RinkuError):
   def __init__(self, message: str = "Requires authentication", status_code: int = 401):
      super().__init__(message, status_code=status_code)


class ResourceMissing(RinkuError):
   def __init__(self, message: str = "This resource could not be found", status_code: int = 404):
      super().__init__(message, status_code=status_code)

class RinkuRedirectionError(RinkuError):
   def __init__(self, message: str, status_code: int = 400, return_to: str | None = None):
      self.return_to = return_to
      super().__init__(message, status_code=status_code)
