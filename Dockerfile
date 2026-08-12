# 1. Build the React frontend.
FROM node:22-alpine AS frontend
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# 2. Build the Spring Boot jar with the frontend inside it. Tests run in CI (they need Docker).
FROM eclipse-temurin:21-jdk AS backend
WORKDIR /app
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN ./mvnw -B -q dependency:go-offline
COPY src src
COPY --from=frontend /app/dist src/main/resources/static
RUN ./mvnw -B -q package -DskipTests

# 3. Runtime: only the JRE and the jar.
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=backend /app/target/*.jar app.jar
EXPOSE 8080
# Tuned for ~512 MB free hosting tiers: a modest heap, capped metaspace, code cache and
# direct memory, the C1 compiler only (less memory, faster startup), the low-overhead serial
# GC, fewer glibc malloc arenas and smaller Netty buffer pools (the Redis client uses Netty).
ENV MALLOC_ARENA_MAX=2
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=40", "-XX:MaxMetaspaceSize=140m", "-XX:ReservedCodeCacheSize=48m", \
    "-XX:MaxDirectMemorySize=48m", "-Dio.netty.allocator.numDirectArenas=2", "-Dio.netty.allocator.numHeapArenas=2", \
    "-XX:TieredStopAtLevel=1", "-XX:+UseSerialGC", "-Xss512k", "-jar", "app.jar"]
