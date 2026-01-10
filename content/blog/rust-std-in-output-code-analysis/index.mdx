---
title: "rust 표준 입출력 코드 분석"
description: "rust의 길고도 기괴한 표준 입력 코드를 보고 놀라서 아는 많큼 정리해본 글"
date: 2022-03-28T12:55:30.277Z
tags: ["Rust", "Syntax"]
---

```rust
use std::io;
fn main() {
    let mut b = String::new();
    io::stdin().read_line(&mut b).expect("Failed to read line");
    let b: Vec<f64> = b
        .split_whitespace()
        .map(|x| x.trim().parse().expect("Please type a number!"))
        .collect::<Vec<_>>();

    println!("{}", b[0] / b[1]);
}
```

위 코드는 백준 문제 `a - b` 문제를 rust로 풀이한 결과이다.
상당히 어지러운데 잠깐 C언어로 푼 버전을 보자.

```c
#include <stdio.h>
int main(void) {
	float a, b;
    scanf("%f %f", &a, &b);
    printf("%f\n",a/b);
}
```

rust와 비교하면 정말 간단하다.

그렇다면 왜 러스트의 경우 저리도 많은 코드를 짜야할까?
바로 **오류**를 방지하기 위해서이다.
만약에 사용자가 `e 2`을 입력하는 경우를 살펴보자
러스트의 경우 `expect()`에 의해 오류를 발생시키고 종료되지만,
C의 경우 `0.673556`같은 이상한 값이 출력된다.

그렇다.. 아직 뭐가 좋은지는 모르겠으나 rust쪽이 불편한건 (어색한건) 사실이다.

## rust 문법 설명

`let mut b = String::new();` 가변적인 String 타입 변수 b 생성
`io::stdin().read_line(&mut b).expect("Failed to read line");` 한줄을 입력받는데 b의 주소에 저장한다.
`let b: Vec<f64> = b.split_whitespace()` 아직 몰?루, 나중에 러스트 더 공부하면 수정해야지 (아마도 공백을 기준으로 나눠서 Vec(대충 배열 비스무리한거) 형식으로 저장)
`.map(|x| x.trim().parse().expect("Plese type a number!"))` map을 이용해 Vec 타입의 b 원소 하나하나를 `trim()`를 이용해 공백제거(이거 안해도 되지 않나?) 하고 `parse()`을 이용해 숫자형으로 변환해주는 코드~~일거다~~이다.
`.collect::<Vec<_>>();` 몰ㄹㄹㄹㄹㄹㄹ루

아직 러린이라서 많은 공부가 필요해보인다.
언젠가 러스트를 파이썬처럼 쓰는 날이 오겠지?
