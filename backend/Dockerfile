# Stage 1: Build Java 17 Spring Boot Backend
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app

# Copy Maven wrapper and POM
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw

# Copy source code and build production jar
COPY src/ src/
RUN ./mvnw clean package -DskipTests

# Stage 2: Runtime image
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create directory for persistent state
RUN mkdir -p /app/.data

# Copy built JAR from builder
COPY --from=builder /app/target/tripcraft-backend.jar app.jar

# Cloud environment settings
ENV HOST=0.0.0.0
ENV PORT=8080
ENV DATA_DIR=/app/.data

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
