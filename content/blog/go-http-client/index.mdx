---
title: Go언어 HTTP 클라이언트 작성
date: 2022-10-09 20:51:16
tags: [golang, http]
---

## Go의 HTTP 클라이언트

HTTP는 클라이언트-서버 기반의 세션을 갖지 않는 프로토콜이며 애플리케이션 계층의 프로토콜

하위 계층의 전송 프로토콜로는 TCP를 사용한다.
\*2021년 7월 HTTP/3가 공개되며 TCP만이 아닌 UDP를 사용하는 HTTP가 등장했다.

### 통합 리소스 식별자 (URL)

클라이언트가 웹 서버를 찾고 요청된 리소르를 식별하는데 사용되는 일종의 주소

| 스키마(scheme) | 권한 정보(authority) | 경로(path)     | 쿼리 파라미터(query arameter) | 쿼리 파라미터 (query parameter) | 정보 조각 (fragment) |
| -------------- | -------------------- | -------------- | ----------------------------- | ------------------------------- | -------------------- |
| scheme://      | user:password@       | host:port/path | ?key1=value1                  | &key2=value2                    | #table_of_contents   |

위에 표처럼 구성되어 있으며 주로 인터넷 상 URL은 최소한 스키마와 호스트 네임만을 포함한다.

> https://images.google.com/

스키마는 브라우저에게 HTTPS를 사용한다고 알렸고, [images.google.com](https://images.google.com)/ 의 경로로 기본리소스를 요청하였다.

### 클라이언트 리소스 요청

HTTP Request은 클라이언트가 서버에게 특정한 리소르를 응답하도록 요청하는 메시지이다.

HTTP은 4가지로 구성되는데 메서드, 대상 리소스, 헤더, 보디로 구성된다.

메서드는 서버에게 대상 리소스로 무엇을 할 것인지에 대한 의도를 나타나고, 요청 헤더에는 전송 요청 시 보내는 데이터에 대한 메타데이터가 포함된다.

만약 PUST 메소드로 보디에 이미지를 담아 전송하려는 경우 요청 헤더에 Content-Length 부분에 이미지의 바이트수가 기록되게 된다.

그리고 요청 보디에는 네트워크로 전송하기 적합한 형태로 인코딩된 이미지를 전송하게 된다.

잠시 netcat 명령어로 구글의 robots.txt 파일 요청을 보내보겠다.

```bash
$ nc www.google.com 80
GET /robots.txt HTTP/1.1

```

응답은 이러하다

```
HTTP/1.1 200 OK Accept-Ranges: bytes Vary: Accept-Encoding Content-Type:
text/plain Cross-Origin-Resource-Policy: cross-origin
Cross-Origin-Opener-Policy-Report-Only: same-origin;
report-to="static-on-bigtable" Report-To:
{"group":"static-on-bigtable","max_age":2592000,"endpoints":[{"url":"https://csp.withgoogle.com/csp/report-to/static-on-bigtable"}]}
Content-Length: 7240 Date: Sat, 16 Jul 2022 02:01:54 GMT Expires: Sat, 16 Jul
2022 02:01:54 GMT Cache-Control: private, max-age=0 Last-Modified: Wed, 13 Jul
2022 19:00:00 GMT X-Content-Type-Options: nosniff Server: sffe X-XSS-Protection:
0 User-agent: * Disallow: /search Allow: /search/about Allow: /search/static
Allow: /search/howsearchworks . . . (생략)
```

맨 위부터 상태라인, 일련의 헤더, 중간의 보디와 구분하는 공백 라인, 응답 보디의 robots.txt 파일이 전송된다.

Go의 net/http 패키지를 이용하면 HTTP 메서드와 URL만 가지고 HTTP 요청을 만들 수 있다.

### 요청 메서드의 종류

| GET     | 서버 리소스를 요청한다.                                                                                                        |
| ------- | ------------------------------------------------------------------------------------------------------------------------------ |
| HEAD    | 요청한 리소스가 생각한 것보다 큰 경우를 대비해 리소스의 정보를 담은 헤더를 우선 요청한다.                                      |
| POST    | 서버에 리소스를 추가하려고 할떄 사용된다.                                                                                      |
| PUT     | 이미 서버에 존재하는 리소스를 업데이터하거나 교체할때 사용한다.                                                                |
| PATCH   | 이미 서버에 존재하는 리소스의 일부분을 수정하는 경우 사용한다.                                                                 |
| DELETE  | 서버에 존재하는 리소스를 제거하기 위해 사용한다.                                                                               |
| OPTIONS | 서버의 특정 리소스에 대해 존재하는 메서드를 알아내기 위해 사용한다.                                                            |
| CONNECT | 웹 서버에 HTTP 터널링을 요청하거나 대상 목적지와 TCP 세션을 수립하고 클라이언트와 목적지 간 데이터 프락싱을 할 수 있게 해준다. |
| TRACE   | 웹 서버에게 요청을 처리하지 말고 에코잉하도록 한다                                                                             |

<aside>
⚙ 서버 측에서 TRACE 메소드를 지원하기 전에 XST (Cross-Site Tracking) 공격에서 TRACE 메서드가 무슨 역활을 하는지 알아보세요 :)
XST 공격에서 공격자는 XSS 공격을 이용해 인증된 사용자의 인증 정보를 훔쳐갑니다.

</aside>

위에 메서드는 모든 서버에서 정확하게 구현하라는 의무는 없어 올바르게 구현되지 않은 웹 서버도 존재한다. 그러니 사용하기 전에 검증을 하는 것이 좋다.

### 서버 응답

자 외우기 귀찮다 그냥 200, 404, 403 정도만 알아두자…

[Hypertext Transfer Protocol (HTTP) Status Code Registry](https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml)

## Go에서 웹 리소스 가져오기

Go언어에서는 브라우저 같이 화면에 HTML 페이지를 렌더링 하지는 않는다.

이제 요청을 만들고 클라이언트 측에서 발생하는 사소한 실수들을 알아보자

### Go의 기본 HTTP 클라이언트 이용하기

net/http 패키지는 일회성으로 HTTP 요청을 할 수 있는 기본 클라이언트가 있다.

예를 들어 http.Head 함수를 이용하여 주어진 URL로 Head 요청을 보낼 수 있다.

다음 코드는 Head 요청을 통해 시간을 불러와 컴퓨터 시간과 비교하는 코드이다.

```go
package main

import (
	"net/http"
	"testing"
	"time"
)

func TestHeadTime(t *testing.T) {
	resp, err := http.Get("https://www.time.gov")
	if err != nil {
		t.Fatal(err)
	}
	_ = resp.Body.Close()

	now := time.Now().Round(time.Second)
	date := resp.Header.Get("Date")
	if date == "" {
		t.Fatal("no Date header received from time.gov")
	}
	dt, err := time.Parse(time.RFC1123, date)
	if err != nil {
		t.Fatal(err)
	}

	t.Logf("time.gov: %s (skew %s)", dt, now.Sub(dt))
}
```

![대략 2초 정도 차이나는것을 확인할 수 있다.](./images/Untitled.png)

대략 2초 정도 차이나는것을 확인할 수 있다.

위에 코드중 3가지 부분에 집중해보자.

첫번째로 Http.Get 함수를 이용한 기본 리소스 요청 부분, 이때 Go의 HTTP 클라이언트는 자동으로 URL 스키마에 지정된 https 프로토콜로 변경한다.

두번째로 응답 보디을 닫는 부분, 잠시 뒤 응답 보디를 읽지는 않지만 반드시 닫아야 하는 이유를 알아보자

마지막으론 응답을 받은 후 서버가 응답을 생성한 시간에 대한 정보인 Date 헤더를 받아오는 부분, 이 정보를 이용해 현재 컴퓨터의 시간과 얼마나 차이가 나는지 비교해 볼 수 있다.

### 응답 보디 닫기

HTTP/1.1은 클라이언트가 서버와의 TCP 연결을 유지하여 여러 개의 HTTP 요청을 유지할 수 있는 기능인 keepalive가 존재한다. 그럼에도 클라이언트는 이전 응답에 읽지 않은 바이트가 존재할 경우 TCP 세션을 재사용할 수 없다고 하는데 Go의 HTTP 클라이언트는 응답 보디를 닫을 때 자동으로 모든 바이트를 소비하여 재사용 할 수 있게 만들어 준다.

따라서 응답 보디를 닫는 것은 TCP 세션 재사용하기 위해 중요하다.

그러나 암목적으로 응답 보디를 소비하는 것은 좋지 못하다.

이때 2가지 방법을 선택할 수 있는데

1. head 메소드를 이용해 필요한 데이터인지 확인하고 요청한다.

   ```jsx
   func TestHeadTime(t *testing.T) {
   	//바디를 소비하는데 발생하는 오버해드 방지
   	resp, err := http.Head("https://www.time.gov")
   	if err != nil {
   		t.Fatal(err)
   	}
   	_ = resp.Body.Close()
   ```

2. io.Copy 함수와 ioutil.Discard 함수를 활용한 명시적 소비

   ```go
   _, _ = io.Copy(ioutil.Discard, resp.Body)
   _ = resp.Body.Close()
   ```

   다음과 같이 Body의 모든 바이트를 읽어서 ioutil.Discard에 전부 쓰는 형태로 응답을 소비한다.

   또한 다음 코드에서 \_ (언더스코어)를 이용해 반환값을 무시했다는 것을 알린다.

### 타인아웃과 취소 구현

위에 코드는 아무런 문제가 없어 보일 수도 있다.

하지만 심각한 문제가 있으니 타임아웃 시간이 설정되있지 않다는 것이다.

이는 즉 실서비스를 해당 코드로 운영하게 된다면 특정 endpoint에 요청이 쌓여 서비스가 오작동하는 경우가 발생할 수 있다는 뜻이다.

다음은 net/http/httptest 패키지에 있는 함수들을 이용해 구현한 루프가 발생하는 서버에 요청을 보낸 경우이다.

```go
package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func blockIndefinitely(w http.ResponseWriter, r *http.Request) {
	select {}
}

func TestBlockIndefinitely(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(blockIndefinitely))
	_, _ = http.Get(ts.URL)
	t.Fatal("client did not indefinitely block")
}
```

httptest.NewServer 함수를 이용해 서버를 생성하는데 HandlerFunc으로 blockIndefinitely 이란 함수를 할당했다.

위에 보이다시피 blockIndefinitely은 사용자정의 함수이고 아무런 핸들링을 하지 않은 것을 볼 수 있다.

다음 서버의 URL로 Get 헬퍼 함수로 요청을 보내지만 타임아웃이 존재하지 않기에 테스트시간이 종료될때까지 갇히게 된다.

![](./images/Untitled-1.png)

테스트 최대 시간 30초로 설정, 오류와 함께 30초에 종료된걸 볼 수 있다.
책에서는 이걸 Go테스트 러너가 타임아웃되어 테스트를 중단하고 스택 트레이스를 출력했다 고 표현했다.

이제 데드라인 콘텍스트를 사용해 연결에 타임아웃을 추가해보자, 또한 타임아웃 후에 연결을 cancel 함수로 취소하는 것 또한 구현해보도록 하자.

위에 코드에 서버로부터 5초간 응답이 없을때 요청을 타임아웃 시키는 기능을 추가했다.

```go
func TestBlockIndefinitelyWithTimeout(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(blockIndefinitely))
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, "GET", ts.URL, nil)
	if err != nil {
		t.Fatal(err)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		if !errors.Is(err, context.DeadlineExceeded) {
			t.Fatal(err)
		}
		return
	}
	_ = resp.Body.Close()
}
```

실행 결과는 다음과 같다.

![5초 안에 끝났으며 자동으로 cancel 처리해 오류도 출력되지 않음](./images/Untitled-2.png)

5초 안에 끝났으며 자동으로 cancel 처리해 오류도 출력되지 않음

또는 다음 코드처럼

### 영속적 TCP 연결 비활성화

작성중…
