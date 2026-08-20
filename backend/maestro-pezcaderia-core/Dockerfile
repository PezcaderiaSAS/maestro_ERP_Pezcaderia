# Stage 1: Build Java 21 Spring Boot Application
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn package -DskipTests

# Stage 2: Runtime image with Eclipse Temurin Java 21 JRE
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
EXPOSE 8080
COPY --from=build /app/target/maestro-pezcaderia-core-1.0.0-SNAPSHOT.jar app.jar
ENTRYPOINT ["java", "-XX:+UseZGC", "-jar", "app.jar"]
