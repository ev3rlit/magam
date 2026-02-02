import { Canvas, MindMap, Node, Text, Markdown } from '@graphwrite/core';

/**
 * NestJS 종합 문서화 마인드맵 (Multiple MindMaps 버전)
 *
 * 처음 보는 사람도 이해할 수 있는 NestJS 종합 가이드
 * 10개의 독립적인 MindMap (앵커 기반 자동 배치)
 */
export default function NestJSComprehensiveGuide() {
  return (
    <Canvas>

      {/* ===== Root: NestJS 중앙 (목차) ===== */}
      <MindMap id="root" layout="bidirectional">
        <Node id="main" bubble>
          <Markdown>
            {`# NestJS

> **효율적이고 확장 가능한 서버 사이드 프레임워크**

TypeScript 기반 Node.js 프레임워크
Angular에서 영감받은 구조화된 아키텍처

---

## 📚 목차

1. [소개](node:/intro/title)
2. [핵심 개념](node:/core/title)
3. [아키텍처](node:/arch/title)
4. [데이터베이스](node:/db/title)
5. [인증/인가](node:/auth/title)
6. [API 개발](node:/api/title)
7. [테스팅](node:/testing/title)
8. [고급 기능](node:/advanced/title)
9. [배포](node:/deploy/title)`}
          </Markdown>
        </Node>
      </MindMap>

      {/* ===== 1. 소개 (루트 왼쪽) ===== */}
      <MindMap id="intro" layout="bidirectional" anchor="root" position="left" gap={200}>
        <Node id="title" bubble>
          <Markdown>{`## 1. 소개

[← 목차](node:/root/main) | [다음: 핵심 개념 →](node:/core/title)`}</Markdown>
        </Node>

        <Node id="what-is-nest" from="title">
          <Text>NestJS란?</Text>
        </Node>

        <Node id="nest-definition" from="what-is-nest">
          <Markdown>
            {`**Node.js 서버 사이드 프레임워크**

- TypeScript 기본 지원
- Express/Fastify 위에서 동작
- 2017년 Kamil Myśliwiec 개발`}
          </Markdown>
        </Node>

        <Node id="nest-inspiration" from="what-is-nest">
          <Markdown>
            {`**Angular에서 영감**

- 데코레이터 기반 문법
- 모듈 시스템
- 의존성 주입 패턴`}
          </Markdown>
        </Node>

        <Node id="why-nest" from="title">
          <Text>왜 NestJS인가?</Text>
        </Node>

        <Node id="nest-advantages" from="why-nest">
          <Markdown>
            {`**주요 장점**

| 장점 | 설명 |
|------|------|
| 구조화 | 명확한 아키텍처 패턴 |
| 타입 안정성 | TypeScript 기본 |
| 모듈화 | 기능별 분리 용이 |
| 테스트 | DI로 테스트 용이 |`}
          </Markdown>
        </Node>

        <Node id="nest-ecosystem" from="why-nest">
          <Markdown>
            {`**풍부한 생태계**

- @nestjs/typeorm
- @nestjs/graphql
- @nestjs/swagger
- @nestjs/microservices
- @nestjs/websockets`}
          </Markdown>
        </Node>

        <Node id="philosophy" from="title">
          <Text>핵심 철학</Text>
        </Node>

        <Node id="philosophy-principles" from="philosophy">
          <Markdown>
            {`**설계 원칙**

- **관심사 분리** (SoC)
- **의존성 역전** (DIP)
- **단일 책임** (SRP)`}
          </Markdown>
        </Node>
      </MindMap>

      {/* ===== 2. 핵심 개념 (루트 오른쪽) ===== */}
      <MindMap id="core" layout="bidirectional" anchor="root" position="right" gap={200}>
        <Node id="title" bubble>
          <Markdown>{`## 2. 핵심 개념

[← 소개](node:/intro/title) | [목차](node:/root/main) | [다음: 아키텍처 →](node:/arch/title)`}</Markdown>
        </Node>

        {/* --- 모듈 --- */}
        <Node id="module" from="title">
          <Text>모듈 (Module)</Text>
        </Node>

        <Node id="module-role" from="module">
          <Markdown>
            {`**역할**

앱의 **구조 단위**
관련 기능을 그룹화`}
          </Markdown>
        </Node>

        <Node id="module-code" from="module">
          <Markdown>
            {`**코드 예제**

\`\`\`typescript
@Module({
  imports: [DatabaseModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
\`\`\``}
          </Markdown>
        </Node>

        <Node id="module-properties" from="module">
          <Text>@Module 속성</Text>
        </Node>

        <Node id="module-imports" from="module-properties">
          <Markdown>
            {`**imports**

다른 모듈 가져오기
해당 모듈의 exports 사용 가능`}
          </Markdown>
        </Node>

        <Node id="module-controllers" from="module-properties">
          <Markdown>
            {`**controllers**

이 모듈의 컨트롤러 등록
HTTP 요청 처리 담당`}
          </Markdown>
        </Node>

        <Node id="module-providers" from="module-properties">
          <Markdown>
            {`**providers**

서비스, 리포지토리 등록
DI 컨테이너에서 관리`}
          </Markdown>
        </Node>

        <Node id="module-exports" from="module-properties">
          <Markdown>
            {`**exports**

다른 모듈에 공개할 프로바이더
import한 모듈에서 사용 가능`}
          </Markdown>
        </Node>

        {/* --- 컨트롤러 --- */}
        <Node id="controller" from="title">
          <Text>컨트롤러 (Controller)</Text>
        </Node>

        <Node id="controller-role" from="controller">
          <Markdown>
            {`**역할**

- HTTP 요청 수신
- 요청 데이터 파싱
- 서비스 호출
- 응답 반환`}
          </Markdown>
        </Node>

        <Node id="controller-code" from="controller">
          <Markdown>
            {`**코드 예제**

\`\`\`typescript
@Controller('users')
export class UserController {
  constructor(
    private userService: UserService
  ) {}

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }
}
\`\`\``}
          </Markdown>
        </Node>

        <Node id="controller-decorators" from="controller">
          <Text>HTTP 데코레이터</Text>
        </Node>

        <Node id="controller-method-decorators" from="controller-decorators">
          <Markdown>
            {`**메서드 데코레이터**

| 데코레이터 | HTTP 메서드 |
|------------|-------------|
| \`@Get()\` | GET |
| \`@Post()\` | POST |
| \`@Put()\` | PUT |
| \`@Patch()\` | PATCH |
| \`@Delete()\` | DELETE |`}
          </Markdown>
        </Node>

        <Node id="controller-param-decorators" from="controller-decorators">
          <Markdown>
            {`**파라미터 데코레이터**

| 데코레이터 | 용도 |
|------------|------|
| \`@Param()\` | URL 파라미터 |
| \`@Query()\` | 쿼리스트링 |
| \`@Body()\` | 요청 본문 |
| \`@Headers()\` | 헤더 값 |`}
          </Markdown>
        </Node>

        {/* --- 프로바이더/서비스 --- */}
        <Node id="provider" from="title">
          <Text>프로바이더 (Provider)</Text>
        </Node>

        <Node id="provider-role" from="provider">
          <Markdown>
            {`**역할**

**비즈니스 로직** 담당
컨트롤러에서 분리된 핵심 로직`}
          </Markdown>
        </Node>

        <Node id="provider-code" from="provider">
          <Markdown>
            {`**코드 예제**

\`\`\`typescript
@Injectable()
export class UserService {
  constructor(
    private userRepo: UserRepository
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepo.find();
  }

  async create(dto: CreateUserDto) {
    const user = this.userRepo.create(dto);
    return this.userRepo.save(user);
  }
}
\`\`\``}
          </Markdown>
        </Node>

        <Node id="provider-types" from="provider">
          <Text>프로바이더 종류</Text>
        </Node>

        <Node id="provider-service" from="provider-types">
          <Markdown>
            {`**Service**

비즈니스 로직 처리
\`UserService\`, \`AuthService\``}
          </Markdown>
        </Node>

        <Node id="provider-repository" from="provider-types">
          <Markdown>
            {`**Repository**

데이터 접근 계층
DB CRUD 작업`}
          </Markdown>
        </Node>

        <Node id="provider-factory" from="provider-types">
          <Markdown>
            {`**Factory**

동적 프로바이더 생성
조건부 인스턴스 생성`}
          </Markdown>
        </Node>

        {/* --- 의존성 주입 --- */}
        <Node id="di" from="title">
          <Text>의존성 주입 (DI)</Text>
        </Node>

        <Node id="di-concept" from="di">
          <Markdown>
            {`**개념**

객체 생성을 **프레임워크에 위임**
클래스 간 결합도 낮춤`}
          </Markdown>
        </Node>

        <Node id="di-methods" from="di">
          <Text>주입 방식</Text>
        </Node>

        <Node id="di-constructor" from="di-methods">
          <Markdown>
            {`**생성자 주입 (권장)**

\`\`\`typescript
constructor(
  private readonly userService: UserService
) {}
\`\`\`

가장 일반적인 방식`}
          </Markdown>
        </Node>

        <Node id="di-property" from="di-methods">
          <Markdown>
            {`**프로퍼티 주입**

\`\`\`typescript
@Inject(UserService)
private userService: UserService;
\`\`\`

선택적 의존성에 사용`}
          </Markdown>
        </Node>

        <Node id="di-advantages" from="di">
          <Markdown>
            {`**장점**

- 느슨한 결합
- 테스트 용이 (Mock 주입)
- 코드 재사용성
- 유지보수 편의`}
          </Markdown>
        </Node>
      </MindMap>

      {/* ===== 3. 아키텍처 (핵심 개념 아래) ===== */}
      <MindMap id="arch" layout="bidirectional" anchor="core" position="bottom" gap={150}>
        <Node id="title" bubble>
          <Markdown>{`## 3. 아키텍처

[← 핵심 개념](node:/core/title) | [목차](node:/root/main) | [다음: 데이터베이스 →](node:/db/title)`}</Markdown>
        </Node>

        {/* --- 요청 라이프사이클 --- */}
        <Node id="lifecycle" from="title">
          <Text>요청 라이프사이클</Text>
        </Node>

        <Node id="lifecycle-flow" from="lifecycle">
          <Markdown>
            {`**처리 순서**

\`\`\`
요청 → Middleware → Guard
→ Interceptor(전) → Pipe
→ Controller → Service
→ Interceptor(후)
→ Exception Filter → 응답
\`\`\``}
          </Markdown>
        </Node>

        {/* --- 미들웨어 --- */}
        <Node id="middleware" from="title">
          <Text>미들웨어 (Middleware)</Text>
        </Node>

        <Node id="middleware-role" from="middleware">
          <Markdown>
            {`**역할**

라우트 핸들러 **이전** 실행
Express 미들웨어와 동일`}
          </Markdown>
        </Node>

        <Node id="middleware-code" from="middleware">
          <Markdown>
            {`**코드 예제**

\`\`\`typescript
@Injectable()
export class LoggerMiddleware
  implements NestMiddleware {

  use(req: Request, res: Response,
      next: NextFunction) {
    console.log(\`[\${req.method}] \${req.url}\`);
    next();
  }
}
\`\`\``}
          </Markdown>
        </Node>

        <Node id="middleware-usecases" from="middleware">
          <Markdown>
            {`**사용 사례**

- 요청 로깅
- CORS 처리
- 요청 본문 파싱
- 압축/암호화`}
          </Markdown>
        </Node>

        {/* --- 가드 --- */}
        <Node id="guard" from="title">
          <Text>가드 (Guard)</Text>
        </Node>

        <Node id="guard-role" from="guard">
          <Markdown>
            {`**역할**

**인증/인가** 검사
요청 허용 여부 결정`}
          </Markdown>
        </Node>

        <Node id="guard-code" from="guard">
          <Markdown>
            {`**코드 예제**

\`\`\`typescript
@Injectable()
export class AuthGuard
  implements CanActivate {

  canActivate(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest();
    return this.validateToken(
      request.headers.authorization
    );
  }
}
\`\`\``}
          </Markdown>
        </Node>

        <Node id="guard-usage" from="guard">
          <Markdown>
            {`**적용 방법**

\`\`\`typescript
// 메서드 레벨
@UseGuards(AuthGuard)
@Get('profile')
getProfile() { }

// 컨트롤러 레벨
@UseGuards(AuthGuard)
@Controller('users')
export class UserController { }

// 전역 레벨
app.useGlobalGuards(new AuthGuard());
\`\`\``}
          </Markdown>
        </Node>

        {/* --- 인터셉터 --- */}
        <Node id="interceptor" from="title">
          <Text>인터셉터 (Interceptor)</Text>
        </Node>

        <Node id="interceptor-role" from="interceptor">
          <Markdown>
            {`**역할**

요청/응답 **변환** 또는 **확장**
AOP(관점 지향) 패턴 구현`}
          </Markdown>
        </Node>

        <Node id="interceptor-code" from="interceptor">
          <Markdown>
            {`**코드 예제**

\`\`\`typescript
@Injectable()
export class TransformInterceptor
  implements NestInterceptor {

  intercept(context, next): Observable<any> {
    return next.handle().pipe(
      map(data => ({
        success: true,
        data,
        timestamp: new Date()
      }))
    );
  }
}
\`\`\``}
          </Markdown>
        </Node>

        <Node id="interceptor-usecases" from="interceptor">
          <Markdown>
            {`**사용 사례**

- 응답 변환 (일관된 형식)
- 로깅/타이밍 측정
- 캐싱`}
          </Markdown>
        </Node>

        {/* --- 파이프 --- */}
        <Node id="pipe" from="title">
          <Text>파이프 (Pipe)</Text>
        </Node>

        <Node id="pipe-role" from="pipe">
          <Markdown>
            {`**역할**

1. **변환**: 입력 데이터 타입 변환
2. **검증**: 데이터 유효성 검사`}
          </Markdown>
        </Node>

        <Node id="pipe-builtin" from="pipe">
          <Markdown>
            {`**내장 파이프**

\`\`\`typescript
@Get(':id')
findOne(
  @Param('id', ParseIntPipe) id: number
) { }
\`\`\`

\`ParseIntPipe\`, \`ParseBoolPipe\`,
\`ParseUUIDPipe\`, \`ValidationPipe\``}
          </Markdown>
        </Node>

        <Node id="pipe-dto-example" from="pipe">
          <Markdown>
            {`**DTO 검증 예제**

\`\`\`typescript
export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsInt()
  @Min(0)
  age: number;
}
\`\`\``}
          </Markdown>
        </Node>

        {/* --- 예외 필터 --- */}
        <Node id="exception-filter" from="title">
          <Text>예외 필터 (Exception Filter)</Text>
        </Node>

        <Node id="filter-role" from="exception-filter">
          <Markdown>
            {`**역할**

예외를 **캐치**하여
응답 형식 **커스터마이징**`}
          </Markdown>
        </Node>

        <Node id="filter-code" from="exception-filter">
          <Markdown>
            {`**코드 예제**

\`\`\`typescript
@Catch(HttpException)
export class HttpExceptionFilter
  implements ExceptionFilter {

  catch(exception: HttpException,
        host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus();

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      timestamp: new Date().toISOString(),
    });
  }
}
\`\`\``}
          </Markdown>
        </Node>

        <Node id="filter-exceptions" from="exception-filter">
          <Markdown>
            {`**내장 예외**

| 예외 | 상태 코드 |
|------|-----------|
| \`BadRequestException\` | 400 |
| \`UnauthorizedException\` | 401 |
| \`ForbiddenException\` | 403 |
| \`NotFoundException\` | 404 |
| \`ConflictException\` | 409 |
| \`InternalServerErrorException\` | 500 |`}
          </Markdown>
        </Node>
      </MindMap>

      {/* ===== 4. 데이터베이스 (아키텍처 아래) ===== */}
      <MindMap id="db" layout="bidirectional" anchor="arch" position="bottom" gap={150}>
        <Node id="title" bubble>
          <Markdown>{`## 4. 데이터베이스

[← 아키텍처](node:/arch/title) | [목차](node:/root/main) | [다음: 인증/인가 →](node:/auth/title)`}</Markdown>
        </Node>

        {/* --- TypeORM --- */}
        <Node id="typeorm" from="title">
          <Text>TypeORM</Text>
        </Node>

        <Node id="typeorm-intro" from="typeorm">
          <Markdown>
            {`**소개**

NestJS **공식 추천** ORM
TypeScript 데코레이터 기반`}
          </Markdown>
        </Node>

        <Node id="typeorm-entity" from="typeorm">
          <Markdown>
            {`**Entity 정의**

\`\`\`typescript
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @OneToMany(() => Post, post => post.author)
  posts: Post[];
}
\`\`\``}
          </Markdown>
        </Node>

        <Node id="typeorm-config" from="typeorm">
          <Markdown>
            {`**모듈 설정**

\`\`\`typescript
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      database: 'mydb',
      entities: [User, Post],
      synchronize: true, // dev only
    }),
  ],
})
\`\`\``}
          </Markdown>
        </Node>

        <Node id="typeorm-relations" from="typeorm">
          <Markdown>
            {`**관계 설정**

\`\`\`typescript
// OneToMany / ManyToOne
@OneToMany(() => Post, post => post.author)
posts: Post[];

@ManyToOne(() => User, user => user.posts)
author: User;

// ManyToMany
@ManyToMany(() => Tag)
@JoinTable()
tags: Tag[];
\`\`\``}
          </Markdown>
        </Node>

        {/* --- Prisma --- */}
        <Node id="prisma" from="title">
          <Text>Prisma</Text>
        </Node>

        <Node id="prisma-intro" from="prisma">
          <Markdown>
            {`**소개**

**타입 안전** 최신 ORM
스키마 기반 자동 타입 생성`}
          </Markdown>
        </Node>

        <Node id="prisma-schema" from="prisma">
          <Markdown>
            {`**스키마 정의**

\`\`\`prisma
// schema.prisma
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  posts Post[]
}

model Post {
  id       Int    @id @default(autoincrement())
  title    String
  author   User   @relation(fields: [authorId])
  authorId Int
}
\`\`\``}
          </Markdown>
        </Node>

        <Node id="prisma-service" from="prisma">
          <Markdown>
            {`**서비스 사용**

\`\`\`typescript
@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      include: { posts: true },
    });
  }

  create(data: CreateUserDto) {
    return this.prisma.user.create({ data });
  }
}
\`\`\``}
          </Markdown>
        </Node>

        {/* --- MongoDB --- */}
        <Node id="mongodb" from="title">
          <Text>MongoDB / Mongoose</Text>
        </Node>

        <Node id="mongodb-intro" from="mongodb">
          <Markdown>
            {`**소개**

**NoSQL** 문서 데이터베이스
유연한 스키마 구조`}
          </Markdown>
        </Node>

        <Node id="mongodb-schema" from="mongodb">
          <Markdown>
            {`**스키마 정의**

\`\`\`typescript
@Schema()
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ unique: true })
  email: string;

  @Prop({ type: [String] })
  roles: string[];
}

export const UserSchema =
  SchemaFactory.createForClass(User);
\`\`\``}
          </Markdown>
        </Node>
      </MindMap>

      {/* ===== 5. 인증/인가 (소개 아래) ===== */}
      <MindMap id="auth" layout="bidirectional" anchor="intro" position="bottom" gap={150}>
        <Node id="title" bubble>
          <Markdown>{`## 5. 인증/인가

[← 데이터베이스](node:/db/title) | [목차](node:/root/main) | [다음: API 개발 →](node:/api/title)`}</Markdown>
        </Node>

        {/* --- Passport --- */}
        <Node id="passport" from="title">
          <Text>Passport.js</Text>
        </Node>

        <Node id="passport-intro" from="passport">
          <Markdown>
            {`**소개**

NestJS 공식 **인증 라이브러리**
다양한 Strategy 지원`}
          </Markdown>
        </Node>

        <Node id="passport-local" from="passport">
          <Markdown>
            {`**Local Strategy**

\`\`\`typescript
@Injectable()
export class LocalStrategy
  extends PassportStrategy(Strategy) {

  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string) {
    const user = await this.authService
      .validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
\`\`\``}
          </Markdown>
        </Node>

        <Node id="passport-strategies" from="passport">
          <Markdown>
            {`**지원 Strategy**

- \`passport-local\`: 이메일/비밀번호
- \`passport-jwt\`: JWT 토큰
- \`passport-google-oauth20\`: Google
- \`passport-github\`: GitHub
- \`passport-kakao\`: Kakao`}
          </Markdown>
        </Node>

        {/* --- JWT --- */}
        <Node id="jwt" from="title">
          <Text>JWT 인증</Text>
        </Node>

        <Node id="jwt-intro" from="jwt">
          <Markdown>
            {`**개념**

**토큰 기반** 무상태 인증
서버 세션 불필요`}
          </Markdown>
        </Node>

        <Node id="jwt-flow" from="jwt">
          <Markdown>
            {`**인증 흐름**

1. 로그인 요청 (email, password)
2. 검증 후 JWT 발급
3. 클라이언트 토큰 저장
4. 요청마다 헤더에 토큰 전송
5. 서버에서 토큰 검증`}
          </Markdown>
        </Node>

        <Node id="jwt-config" from="jwt">
          <Markdown>
            {`**모듈 설정**

\`\`\`typescript
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
})
\`\`\``}
          </Markdown>
        </Node>

        <Node id="jwt-login" from="jwt">
          <Markdown>
            {`**토큰 발급**

\`\`\`typescript
async login(user: User) {
  const payload = {
    sub: user.id,
    email: user.email
  };
  return {
    access_token: this.jwtService.sign(payload),
  };
}
\`\`\``}
          </Markdown>
        </Node>

        {/* --- 세션 --- */}
        <Node id="session" from="title">
          <Text>세션 기반 인증</Text>
        </Node>

        <Node id="session-intro" from="session">
          <Markdown>
            {`**개념**

**서버 측** 세션 저장
세션 ID를 쿠키로 전달`}
          </Markdown>
        </Node>

        <Node id="session-config" from="session">
          <Markdown>
            {`**설정**

\`\`\`typescript
// main.ts
app.use(
  session({
    secret: 'my-secret',
    resave: false,
    saveUninitialized: false,
    store: new RedisStore({
      client: redisClient
    }),
  }),
);
app.use(passport.initialize());
app.use(passport.session());
\`\`\``}
          </Markdown>
        </Node>

        <Node id="session-advantage" from="session">
          <Markdown>
            {`**장점**

- 서버에서 세션 무효화 가능
- 민감 정보 서버 보관
- 토큰 탈취 위험 감소`}
          </Markdown>
        </Node>
      </MindMap>

      {/* ===== 6. API 개발 (루트 아래) ===== */}
      <MindMap id="api" layout="bidirectional" anchor="root" position="bottom" gap={200}>
        <Node id="title" bubble>
          <Markdown>{`## 6. API 개발

[← 인증/인가](node:/auth/title) | [목차](node:/root/main) | [다음: 테스팅 →](node:/testing/title)`}</Markdown>
        </Node>

        {/* --- REST API --- */}
        <Node id="rest-api" from="title">
          <Text>REST API</Text>
        </Node>

        <Node id="rest-intro" from="rest-api">
          <Markdown>
            {`**소개**

HTTP 메서드 기반 API
리소스 중심 설계`}
          </Markdown>
        </Node>

        <Node id="rest-crud" from="rest-api">
          <Markdown>
            {`**CRUD 예제**

\`\`\`typescript
@Controller('users')
export class UserController {
  @Get()           // GET /users
  findAll() { }

  @Get(':id')      // GET /users/:id
  findOne(@Param('id') id: string) { }

  @Post()          // POST /users
  create(@Body() dto: CreateUserDto) { }

  @Put(':id')      // PUT /users/:id
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto
  ) { }

  @Delete(':id')   // DELETE /users/:id
  remove(@Param('id') id: string) { }
}
\`\`\``}
          </Markdown>
        </Node>

        <Node id="rest-swagger" from="rest-api">
          <Markdown>
            {`**Swagger 문서화**

\`\`\`typescript
@ApiTags('users')
@Controller('users')
export class UserController {
  @ApiOperation({ summary: '사용자 목록' })
  @ApiResponse({ status: 200, type: [User] })
  @Get()
  findAll() { }
}
\`\`\`

\`@nestjs/swagger\` 패키지 사용`}
          </Markdown>
        </Node>

        {/* --- GraphQL --- */}
        <Node id="graphql" from="title">
          <Text>GraphQL</Text>
        </Node>

        <Node id="graphql-intro" from="graphql">
          <Markdown>
            {`**소개**

**스키마 기반** 쿼리 언어
클라이언트가 필요한 데이터만 요청`}
          </Markdown>
        </Node>

        <Node id="graphql-code-first" from="graphql">
          <Markdown>
            {`**Code First**

\`\`\`typescript
@ObjectType()
export class User {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;
}
\`\`\``}
          </Markdown>
        </Node>

        <Node id="graphql-resolver" from="graphql">
          <Markdown>
            {`**Resolver**

\`\`\`typescript
@Resolver(() => User)
export class UserResolver {
  @Query(() => [User])
  users() {
    return this.userService.findAll();
  }

  @Mutation(() => User)
  createUser(@Args('input') input: CreateUserInput) {
    return this.userService.create(input);
  }
}
\`\`\``}
          </Markdown>
        </Node>

        {/* --- WebSocket --- */}
        <Node id="websocket" from="title">
          <Text>WebSocket</Text>
        </Node>

        <Node id="websocket-intro" from="websocket">
          <Markdown>
            {`**소개**

**실시간 양방향** 통신
채팅, 알림, 게임 등에 적합`}
          </Markdown>
        </Node>

        <Node id="websocket-gateway" from="websocket">
          <Markdown>
            {`**Gateway 정의**

\`\`\`typescript
@WebSocketGateway({
  cors: { origin: '*' },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: string,
    @ConnectedSocket() client: Socket,
  ) {
    this.server.emit('message', data);
    return { event: 'message', data };
  }
}
\`\`\``}
          </Markdown>
        </Node>
      </MindMap>

      {/* ===== 7. 테스팅 (인증/인가 아래) ===== */}
      <MindMap id="testing" layout="bidirectional" anchor="auth" position="bottom" gap={150}>
        <Node id="title" bubble>
          <Markdown>{`## 7. 테스팅

[← API 개발](node:/api/title) | [목차](node:/root/main) | [다음: 고급 기능 →](node:/advanced/title)`}</Markdown>
        </Node>

        {/* --- 단위 테스트 --- */}
        <Node id="unit-test" from="title">
          <Text>단위 테스트</Text>
        </Node>

        <Node id="unit-intro" from="unit-test">
          <Markdown>
            {`**목적**

개별 클래스/함수 **격리 테스트**
의존성은 Mock으로 대체`}
          </Markdown>
        </Node>

        <Node id="unit-setup" from="unit-test">
          <Markdown>
            {`**테스트 모듈 설정**

\`\`\`typescript
beforeEach(async () => {
  const module = await Test.createTestingModule({
    providers: [
      UserService,
      {
        provide: getRepositoryToken(User),
        useFactory: repositoryMockFactory,
      },
    ],
  }).compile();

  service = module.get(UserService);
  repository = module.get(getRepositoryToken(User));
});
\`\`\``}
          </Markdown>
        </Node>

        <Node id="unit-example" from="unit-test">
          <Markdown>
            {`**테스트 케이스**

\`\`\`typescript
describe('UserService', () => {
  it('should find a user by id', async () => {
    const user = { id: 1, name: 'John' };
    repository.findOne.mockReturnValue(user);

    const result = await service.findOne(1);

    expect(result).toEqual(user);
    expect(repository.findOne)
      .toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
\`\`\`

\`npm run test\` 실행`}
          </Markdown>
        </Node>

        {/* --- E2E 테스트 --- */}
        <Node id="e2e-test" from="title">
          <Text>E2E 테스트</Text>
        </Node>

        <Node id="e2e-intro" from="e2e-test">
          <Markdown>
            {`**목적**

**전체 요청-응답** 흐름 테스트
실제 API 엔드포인트 검증`}
          </Markdown>
        </Node>

        <Node id="e2e-example" from="e2e-test">
          <Markdown>
            {`**테스트 예제**

\`\`\`typescript
describe('UserController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test
      .createTestingModule({
        imports: [AppModule],
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/users (GET)', () => {
    return request(app.getHttpServer())
      .get('/users')
      .expect(200)
      .expect([]);
  });

  afterAll(() => app.close());
});
\`\`\`

\`npm run test:e2e\` 실행`}
          </Markdown>
        </Node>

        {/* --- 모킹 --- */}
        <Node id="mocking" from="title">
          <Text>테스트 모킹</Text>
        </Node>

        <Node id="mock-example" from="mocking">
          <Markdown>
            {`**Mock 생성**

\`\`\`typescript
const mockUserService = {
  findAll: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockImplementation(
    dto => Promise.resolve({ id: 1, ...dto })
  ),
};

// 테스트 모듈에서 사용
providers: [
  {
    provide: UserService,
    useValue: mockUserService,
  },
],
\`\`\``}
          </Markdown>
        </Node>

        <Node id="mock-verify" from="mocking">
          <Markdown>
            {`**호출 검증**

\`\`\`typescript
// 호출 여부 확인
expect(mockUserService.create)
  .toHaveBeenCalled();

// 인자 확인
expect(mockUserService.create)
  .toHaveBeenCalledWith(createUserDto);

// 호출 횟수 확인
expect(mockUserService.create)
  .toHaveBeenCalledTimes(1);
\`\`\``}
          </Markdown>
        </Node>
      </MindMap>

      {/* ===== 8. 고급 기능 (루트 위) ===== */}
      <MindMap id="advanced" layout="bidirectional" anchor="root" position="top" gap={200}>
        <Node id="title" bubble>
          <Markdown>{`## 8. 고급 기능

[← 테스팅](node:/testing/title) | [목차](node:/root/main) | [다음: 배포 →](node:/deploy/title)`}</Markdown>
        </Node>

        {/* --- 마이크로서비스 --- */}
        <Node id="microservices" from="title">
          <Text>마이크로서비스</Text>
        </Node>

        <Node id="micro-intro" from="microservices">
          <Markdown>
            {`**개념**

**분산 시스템** 아키텍처
독립적인 서비스들의 조합`}
          </Markdown>
        </Node>

        <Node id="micro-transport" from="microservices">
          <Markdown>
            {`**트랜스포트 종류**

| 트랜스포트 | 특징 |
|------------|------|
| TCP | 기본, 간단한 통신 |
| Redis | Pub/Sub 패턴 |
| RabbitMQ | 메시지 큐 |
| Kafka | 대용량 스트리밍 |
| gRPC | 고성능 RPC |`}
          </Markdown>
        </Node>

        <Node id="micro-pattern" from="microservices">
          <Markdown>
            {`**메시지 패턴**

\`\`\`typescript
// 서비스 측
@MessagePattern({ cmd: 'get_user' })
getUser(@Payload() id: number) {
  return this.userService.findOne(id);
}

// 클라이언트 측
@Client({ transport: Transport.TCP })
client: ClientProxy;

getUser(id: number) {
  return this.client
    .send({ cmd: 'get_user' }, id);
}
\`\`\``}
          </Markdown>
        </Node>

        {/* --- 큐 --- */}
        <Node id="queue" from="title">
          <Text>큐 (Queue)</Text>
        </Node>

        <Node id="queue-intro" from="queue">
          <Markdown>
            {`**개념**

**비동기 작업** 처리
시간 소요 작업 백그라운드 실행`}
          </Markdown>
        </Node>

        <Node id="queue-producer" from="queue">
          <Markdown>
            {`**작업 추가 (Producer)**

\`\`\`typescript
@Injectable()
export class EmailService {
  constructor(
    @InjectQueue('email')
    private emailQueue: Queue
  ) {}

  async sendWelcomeEmail(user: User) {
    await this.emailQueue.add('welcome', {
      to: user.email,
      name: user.name,
    });
  }
}
\`\`\``}
          </Markdown>
        </Node>

        <Node id="queue-consumer" from="queue">
          <Markdown>
            {`**작업 처리 (Consumer)**

\`\`\`typescript
@Processor('email')
export class EmailProcessor {
  @Process('welcome')
  async handleWelcome(job: Job) {
    const { to, name } = job.data;
    await this.mailer.send({
      to,
      subject: '환영합니다!',
      body: \`안녕하세요, \${name}님\`
    });
  }
}
\`\`\`

Bull (Redis 기반) 라이브러리`}
          </Markdown>
        </Node>

        {/* --- 캐싱 --- */}
        <Node id="caching" from="title">
          <Text>캐싱 (Caching)</Text>
        </Node>

        <Node id="cache-intro" from="caching">
          <Markdown>
            {`**목적**

**응답 속도** 향상
DB 부하 감소`}
          </Markdown>
        </Node>

        <Node id="cache-auto" from="caching">
          <Markdown>
            {`**자동 캐싱**

\`\`\`typescript
@UseInterceptors(CacheInterceptor)
@Get()
findAll() {
  return this.userService.findAll();
}
\`\`\`

CacheInterceptor가 자동으로
응답을 캐시에 저장/반환`}
          </Markdown>
        </Node>

        <Node id="cache-manual" from="caching">
          <Markdown>
            {`**수동 캐싱**

\`\`\`typescript
@Injectable()
export class UserService {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache
  ) {}

  async findOne(id: number) {
    const key = \`user:\${id}\`;
    const cached = await this.cacheManager.get(key);
    if (cached) return cached;

    const user = await this.userRepo.findOne(id);
    await this.cacheManager.set(key, user, 3600);
    return user;
  }
}
\`\`\``}
          </Markdown>
        </Node>

        {/* --- 스케줄링 --- */}
        <Node id="scheduling" from="title">
          <Text>태스크 스케줄링</Text>
        </Node>

        <Node id="schedule-intro" from="scheduling">
          <Markdown>
            {`**목적**

**정기 작업** 자동 실행
백업, 정리, 알림 등`}
          </Markdown>
        </Node>

        <Node id="schedule-cron" from="scheduling">
          <Markdown>
            {`**Cron 표현식**

\`\`\`typescript
@Injectable()
export class TaskService {
  // 매 30초마다
  @Cron('*/30 * * * * *')
  handleEvery30Sec() { }

  // 매일 자정
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  handleDaily() { }

  // 매주 월요일 오전 9시
  @Cron('0 9 * * MON')
  handleWeekly() { }
}
\`\`\`

\`@nestjs/schedule\` 패키지`}
          </Markdown>
        </Node>
      </MindMap>

      {/* ===== 9. 배포 (API 개발 아래) ===== */}
      <MindMap id="deploy" layout="bidirectional" anchor="api" position="bottom" gap={150}>
        <Node id="title" bubble>
          <Markdown>{`## 9. 배포

[← 고급 기능](node:/advanced/title) | [목차](node:/root/main)`}</Markdown>
        </Node>

        {/* --- Docker --- */}
        <Node id="docker" from="title">
          <Text>Docker</Text>
        </Node>

        <Node id="docker-intro" from="docker">
          <Markdown>
            {`**장점**

- 환경 일관성
- 쉬운 확장
- 격리된 실행 환경`}
          </Markdown>
        </Node>

        <Node id="docker-file" from="docker">
          <Markdown>
            {`**Dockerfile**

\`\`\`dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/main"]
\`\`\``}
          </Markdown>
        </Node>

        <Node id="docker-compose" from="docker">
          <Markdown>
            {`**docker-compose.yml**

\`\`\`yaml
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://...
    depends_on:
      - postgres
  postgres:
    image: postgres:15
    volumes:
      - pgdata:/var/lib/postgresql/data
\`\`\`

\`docker-compose up -d\``}
          </Markdown>
        </Node>

        {/* --- PM2 --- */}
        <Node id="pm2" from="title">
          <Text>PM2</Text>
        </Node>

        <Node id="pm2-intro" from="pm2">
          <Markdown>
            {`**장점**

- 클러스터 모드
- 자동 재시작
- 로그 관리
- 모니터링`}
          </Markdown>
        </Node>

        <Node id="pm2-config" from="pm2">
          <Markdown>
            {`**ecosystem.config.js**

\`\`\`javascript
module.exports = {
  apps: [{
    name: 'nest-app',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
  }],
};
\`\`\``}
          </Markdown>
        </Node>

        <Node id="pm2-commands" from="pm2">
          <Markdown>
            {`**주요 명령어**

\`\`\`bash
pm2 start ecosystem.config.js
pm2 status      # 상태 확인
pm2 logs        # 로그 확인
pm2 reload all  # 무중단 재시작
pm2 monit       # 모니터링
\`\`\``}
          </Markdown>
        </Node>

        {/* --- 클라우드 --- */}
        <Node id="cloud" from="title">
          <Text>클라우드 배포</Text>
        </Node>

        <Node id="cloud-platforms" from="cloud">
          <Markdown>
            {`**플랫폼 비교**

| 플랫폼 | 서비스 |
|--------|--------|
| AWS | ECS, Lambda, EB |
| GCP | Cloud Run, GKE |
| Azure | App Service, AKS |
| Vercel | 서버리스 |
| Railway | 간편 배포 |`}
          </Markdown>
        </Node>

        <Node id="cloud-cicd" from="cloud">
          <Markdown>
            {`**GitHub Actions CI/CD**

\`\`\`yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
      - run: npm run test
      # 클라우드 배포 단계
\`\`\``}
          </Markdown>
        </Node>

        <Node id="cloud-tips" from="cloud">
          <Markdown>
            {`**배포 팁**

- 환경변수는 Secret Manager
- 헬스체크 엔드포인트 구현
- 로깅 서비스 연동
- 오토스케일링 설정`}
          </Markdown>
        </Node>
      </MindMap>

    </Canvas>
  );
}
