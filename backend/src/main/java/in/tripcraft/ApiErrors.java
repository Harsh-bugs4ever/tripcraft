package in.tripcraft;

import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class ApiErrors {
  @ExceptionHandler(ApiException.class)
  public ResponseEntity<?> api(ApiException e) {
    return ResponseEntity.status(e.status).body(Json.obj("detail", e.getMessage()));
  }

  @ExceptionHandler({
    MethodArgumentNotValidException.class,
    HttpMessageNotReadableException.class,
    IllegalArgumentException.class
  })
  public ResponseEntity<?> invalid(Exception e) {
    return ResponseEntity.unprocessableEntity()
        .body(
            Json.obj(
                "detail",
                "Invalid request. Check dates, traveler counts, budget and required fields."));
  }

  @ExceptionHandler(org.springframework.web.ErrorResponseException.class)
  public ResponseEntity<?> httpError(org.springframework.web.ErrorResponseException e) {
    return ResponseEntity.status(e.getStatusCode()).body(Json.obj("detail", e.getBody().getDetail()));
  }

  @ExceptionHandler({org.springframework.web.servlet.resource.NoResourceFoundException.class,
      org.springframework.web.servlet.NoHandlerFoundException.class})
  public ResponseEntity<?> notFound(Exception e) {
    return ResponseEntity.status(404).body(Json.obj("detail", "Route not found."));
  }

  @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
  public ResponseEntity<?> method(org.springframework.web.HttpRequestMethodNotSupportedException e) {
    return ResponseEntity.status(405).body(Json.obj("detail", "HTTP method not supported for this route."));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<?> unexpected(Exception e) {
    LoggerFactory.getLogger(ApiErrors.class)
        .error("Request failed: {}", e.getClass().getSimpleName());
    return ResponseEntity.internalServerError()
        .body(
            Json.obj(
                "detail",
                "The server could not complete this request. Your existing plan was not changed."));
  }
}
