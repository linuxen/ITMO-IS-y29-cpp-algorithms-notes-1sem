@@ cpp-basics
# Типы, выражения, условия, циклы и функции
> От первой программы до функций, областей видимости и ввода данных.

## Типы данных, идентификаторы, операторы, операторы ветвления, циклы, функции

## Code Style

<https://github.com/is-itmo-c-25/cpp-coding-guidelines>

## Встроенные типы данных

![Иллюстрация к теме «Встроенные типы данных»](assets/media/cc40caa5ce3714e17d.png)

nullptr_t

На распространённых 32- и 64-разрядных платформах `int` занимает 4 байта. Стандарт допускает другие размеры. На конкретной платформе используйте `sizeof(int)`.

## Модификаторы

- signed
- unsigned

`signed` допускает отрицательные значения.
`unsigned` хранит неотрицательные значения.

Заголовок `<cstdint>` предоставляет целые типы фиксированной ширины, если платформа их поддерживает.
`std::int8_t` — знаковый 8-битный тип, `std::uint8_t` — беззнаковый 8-битный тип.

![Иллюстрация к теме «Модификаторы»](assets/media/fe05dde6b2895bba35.png)

`int b = 0242;` — восьмеричный литерал.
`int c = 0x16;` — шестнадцатеричный литерал.
`int z = 0b101;` — двоичный литерал.

В дополнительном коде старший бит отрицательного значения равен 1. Чтобы получить запись числа −x в фиксированной разрядности, инвертируйте биты x и прибавьте 1.

Сложение и вычитание обычно имеют сопоставимую стоимость. Выбирайте операцию по смыслу и проверяйте производительность измерениями.

**Соглашение о стиле.** Объявляйте каждую переменную на своей строке.


## Целочисленные литералы

![Иллюстрация к теме «Целочисленные литералы»](assets/media/5173126c232d695463.png)

## Вещественные литералы

![Иллюстрация к теме «Вещественные литералы»](assets/media/3765980c5b4abbce70.png)

## Представление чисел в памяти

![Иллюстрация к теме «Представление чисел в памяти»](assets/media/9a08e43a1f23476d43.png)

## Управляющие последовательности и символьные литералы

![Иллюстрация к теме «Управляющие последовательности и символьные литералы»](assets/media/b27156344eec18c3a1.png)

## Строковые литералы

![Иллюстрация к теме «Строковые литералы»](assets/media/95a7216bc47e46150b.png)

## Enum (перечислимый тип)
- Перечисляемый тип
### Перечисление и структура

`Enum` (перечисление) — это пользовательский тип данных, который представляет собой набор именованных констант, тогда как `struct` (структура) — это пользовательский тип данных, который может содержать несколько полей разных типов данных одновременно. Ключевое отличие заключается в назначении: `enum` используется для выбора из фиксированного набора взаимоисключающих вариантов, а `struct` — для группировки нескольких связанных полей в одну сущность

```cpp
#include <iostream>

enum hello {
	OFF = 0,
	ON = 1,
	SLEEP = -1
};

int main(){
std::cout << hello::OFF;
}
```

```cpp
#include <iostream>

enum helloPC {
НОРМ,
ГРЕЮСЬ,
ГОРЮ
};

int main() {
std::cout << helloPC::ГРЕЮСЬ;
}
```


**Пример ошибки компиляции.** В перечислении каждый элемент должен иметь имя. Для явного значения используйте запись вида `ГОРЮ = 15`.
```cpp
#include <iostream>

enum helloPC {
НОРМ,
ГРЕЮСЬ,
15  // WARNING!!!!!
};

int main() {
std::cout << helloPC::ГРЕЮСЬ;
}
```

## Объявления и определения функций

![Иллюстрация к теме «Функции. declarations & deﬁnitions»](assets/media/083ca7595e8eafe134.png)

## Преобразования типов

Неявные преобразования
▫ Если какой-либо из операндов принадлежит типу long double, то и другой
приводится к long double.
▫ В противном случае, если какой-либо из операндов принадлежит типу
double, то и другой приводится к double.
▫ В противном случае, если какой-либо из операндов принадлежит типу float,
то и другой приводится к float.
▫ В противном случае операнды типов char и short приводятся к int.
▫ И наконец, если один из операндов типа long, то и другой приводится к long.
• Явное преобразование
(c-style cast) (тип) переменная

## sizeof

```cpp
#include <iostream>

int main(){
std::cout << sizeof(int);
}

// output 4
```

## Символы в с++ и что они значат

![Иллюстрация к теме «Символы в с++ и что они значат»](assets/media/117f692dd3347ca61f.png)
![Иллюстрация к теме «Символы в с++ и что они значат»](assets/media/0c8eb75d10fc28c357.png)

## Функции

```cpp
#include <iostream>

void foo(){
    std::cout << "Hello foo" << '\n';
}
int Sum(int a, int b){
    int result = a+b;
    return result;
}
int main(){

    foo();
    int c = Sum(1, 1);
    std::cout << c;
}
```

```cpp
#include <iostream>

void foo(){
    std::cout << "Hello foo" << '\n';
}

int Sum(int a, int b){
    return a+b;
}

int main(){
    foo();
    std:: cout << Sum(1, 1);
}
```

### Передача массива в функцию

```cpp
#include <iostream>

 void Array(int arr[], const int size){
    for (int i = 0; i < size; i++) {
        arr[i] = 0;
    }
}

void PrintArr(int arr[], const int size) {
    for (int i = 0; i < size; i++){
        std::cout << arr[i];
    }
}

int main(){
    const int size = 10;
    int arr[size];
    Array(arr, size);
    PrintArr(arr, size);
}
```
### Предварительное объявление функции

```cpp
#include <iostream>

void Array(int arr[], const int size);
void PrintArr(int arr[], const int size);

int main(){
    const int size = 10;
    int arr[size];
    Array(arr, size);
    PrintArr(arr, size);
}

void Array(int arr[], const int size){
    for (int i = 0; i < size; i++) {
        arr[i] = 0;
    }
}

void PrintArr(int arr[], const int size) {
    for (int i = 0; i < size; i++){
        std::cout << arr[i];
    }
}

```


## Сокрытие имён внешней области видимости

Затенение внешних переменных (или переменная-затенение) — это ситуация в программировании, когда переменная во внутренней области видимости объявляется с тем же именем, что и переменная во внешней, глобальной области видимости

## Тернарный оператор

b_5 = (x > 10) ? (10) : (5);

1 условие 2 и 3 да или нет

## Примеры управляющих конструкций

sizeof(int) - размер инта

enum можно засунуть в switch
```cpp
#include <iostream>

int main() {
    enum Color {
        Red,
        Green,
        Blue
    };
    Color color = Color::Red;
    switch (color)
    {
    case Color::Red:
        std::cout << "Ok"<< '\n';
        break;
    default:
        break;
    }
	}
```

Функция
```cpp
#include <iostream>

int blala(u_int64_t a) {
    int result;
    result = a * a;
    return result;
}

int main () {
    std::cout << blala(7) << "\n";
}
```

Рекурсия факториала
```cpp
#include <iostream>

int factorial(u_int64_t n) {
    if (n == 0){
        return 1;
    }
    return n * factorial(n - 1);
}

int main () {
    std::cout << factorial(3) << "\n";
}
```

Указатели и место в памяти
```cpp
#include <iostream>

int main () {
    int x = 10;
    int* x_ptr = &x;
    std::cout << *x_ptr << " " << &x << '\n';
}
```
&x - место в памяти для переменной x
*x_ptr - указатель на x который выодит число на экран

```cpp
#include <iostream>

int main () {
    int arr[10];

    std::cout << &arr << '\n';
}
```
указатель на массив хранит адрес его первого символа

**Каков размер указателя?** На многих 64-разрядных платформах он равен 8 байтам. Размер зависит от платформы и типа указателя.

@@ cpp-addresses
# Указатели, ссылки, массивы и строки
> Адрес объекта, передача параметров и время жизни данных.

## Указатели, массивы и строки

## Указатели


![Иллюстрация к теме «Указатели»](assets/media/34e6d5798bd8decc48.png)

```cpp
#include <iostream>

int main(){
    int a = 5;
    int *px = &a;
    std::cout << px;
}
```
`px` получает адрес переменной `a`. Оператор `&` берёт адрес объекта.

```cpp
#include <iostream>

int main(){
    int a = 5;
    int *px = &a;
    std::cout << *px;
}
```
выводим значение указателя px

![Иллюстрация к теме «Указатели»](assets/media/8e5189665d8d32e0b2.png)
![Иллюстрация к теме «Указатели»](assets/media/30d86a8ab2e96348a0.png)

```cpp
#include <iostream>

int main(){
    int a = 5;
    int *px = &a;
    int *px2 = &a;

    std::cout << *px << '\n';

    *px2 = 2;

    std::cout << a << '\n';
}
```
выводим сначала значение a через указатель, а потом заменяем само а через указатель px2

```cpp
#include <iostream>

int main(){
    int a = 5;
    int arr[5] = {1, 2, 3, 4, 5};
    int *pArr = arr;
    std::cout << *(pArr+3);
}
```
выводим значение 4 элемента массива через указатели

```cpp
#include <iostream>

void foo(int *pa){
    (*pa)++; // сначала получаем значение потом ++
}

int main(){
    int a = 1;
    foo(&a);
    std::cout << a;
}
```
работа с переменной в функции

```cpp
#include <iostream>

void foo(int *pa, int *px, int *pu) {
    (*pa)++;
    *px = 52;
    *pu = 53;
}
int main(){
    int a = 1;
    int b = 2;
    int c = 3;
    foo(&a, &b, &c);
    std::cout << a << " " << b << " " << c;
}
```
передача в функцию несколько значений указателей

```cpp
#include <iostream>

void foo(int *pa, int *pb) {
    int temp;
    temp = *pb;
    *pb = *pa;
    *pa = temp;
}

int main(){
    int a = 1;
    int b = 2;
    foo(&a, &b);
    std::cout << a << " " << b;
}
```
Обмен значений через указатели

![Иллюстрация к теме «Указатели»](assets/media/4b7cb3493366f91edc.png)

![Иллюстрация к теме «Указатели»](assets/media/287d1416de94fd2d29.png)

![Иллюстрация к теме «Указатели»](assets/media/d6c64b2b54641fd72c.png)

![Иллюстрация к теме «Указатели»](assets/media/ce22b327a8cf225086.png)

![Иллюстрация к теме «Указатели»](assets/media/8c2a81410b66892a8a.png)

### Инкремент указателя

Указатель - переменная в которой хранится адрес переменной

```cpp
#include <iostream>

int main(){
    int a = 52;

    int* f = &a;
    int* newf = &a;

    std::cout << *f << " ";
    *newf = 53;
    std::cout << *newf;
}
```

указатель в функции

```cpp
#include <iostream>

void swap_1(int x1,int  x2) {
    int tmp = x2;
    x2 = x1;
    x1 = tmp;
}

void swap_2(int *x1,int *x2){
    int tmp = *x2;
    *x2 = *x1;
    *x1 = tmp;
}

int main(){
    int x1 = 10;
    int x2 = 1;

   swap_1(x1, x2);
   std::cout << x1 << " " << x2;
   std::cout << '\n';

   swap_2(&x1, &x2);
   std::cout << x1 << " " << x2;
}
```

### арифметика указателей

```cpp
#include <iostream>

int main(){
    int arr[5] = {1, 2, 3, 4, 5};
    std::cout << *(arr + 2) << '\n'; // имя массива + двигаем указатель вправо
}
```
Операции над указателями на элементы массива
1. Прибавление целого смещения. Если `a` указывает на элемент массива, `a + i` указывает на элемент со смещением `i` в пределах массива либо на позицию сразу за ним.
2. Присваивание. Значение можно присвоить указателю совместимого типа.
3. Сравнение. Указатели на элементы одного массива можно сравнивать по их позициям.
```cpp
#include <iostream>
int main(){
    int arr[5] = {1, 2, 3, 4, 5};
    int *p_1 = arr + 3;
    int *p_2 = arr;
    if (p_1 > p_2){
        std::cout << "OK";
    }
}
```
4. Разность двух указателей внутри одного массива даёт расстояние между элементами в единицах типа элемента.
```cpp
#include <iostream>
int main(){
    int arr[5] = {1, 2, 3, 4, 5};
    int *p_1 = arr + 3;
    int *p_2 = arr;
    std::cout << p_1 - p_2;
}
```

### Указатель void*

`void*` может хранить адрес объекта любого типа. Перед разыменованием восстановите тип указателя, соответствующий объекту.

```cpp
#include <iostream>
int main(){
    int x = 10;
    char f = 'd';
    float s = 10.78;

    void* p;
    p = &x;
    std::cout << *(int* )p << " ";
    p = &f;
    std::cout << *(char* )p << " ";
    p = &s;
    std::cout << *(float* )p<< " ";
}
```

### Вывод строки

```cpp
#include <iostream>
int main(){
    const char* arr[] = {"python", "java", "c++"};
    int size = sizeof(arr) / sizeof(arr[0]);
    for (int i = 0; i < size; i++) {
        std::cout << *(arr + i) << " ";
   }
}
```

### Указатель на функцию

```cpp
#include <iostream>
void swap(int *x1,int *x2){
    int tmp = *x2;
    *x2 = *x1;
    *x1 = tmp;
}
int main(){
    void (*p_swap)(int* x1, int* x2) = swap;
    int x1 = 10;
    int x2 = 1;
    p_swap(&x1, &x2);
    std::cout << x1 << " " << x2;
}
```

### Указатель на структуру struct

```cpp
#include <iostream>

struct ichbin {
    char name[100];
    int age;
};

int main() {
    struct ichbin ADD = {"Mickhail", 18};
    struct ichbin *p1 = &ADD;
    std::cout << p1 -> name; //доступ к элементу структуры через указатель
}
```

## Строка

![Иллюстрация к теме «Строка»](assets/media/e83210c10ec884ab12.png)


## Массив

![Иллюстрация к теме «Массив»](assets/media/d3e8826d79a5556d8b.png)
Если элементов введено меньше чем кол-во элементов на которые задан массив пустые мечта заполняются нулями

sizeof(arr) - выводит объем массива

## static_cast, reinterpret_cast и приведение в стиле C

Это основное средство приведения типов, которое проверяется на этапе **компиляции**.

- **Что делает:**
    - Преобразует связанные типы: например, `int` в `float` или `enum` в `int`.
    - Выполняет преобразования по иерархии наследования: от производного класса к базовому (upcast) и от базового к производному (downcast).
    - **Важно:** При downcast (от родителя к потомку) `static_cast` не делает проверку типа во время выполнения. Если объект на самом деле не является целевым типом, возникнет неопределенное поведение.
    - Вызывает соответствующие конструкторы или операторы преобразования.


Это низкоуровневое и потенциально опасное приведение типов.

- **Что делает:**
    - Просто интерпретирует последовательность битов одного типа как другой тип.
    - Обычно используется для преобразования указателя одного типа в указатель другого (например, `int*` в `char*`) или указателя в целое число и обратно.
    - **Важно:** Он не генерирует никакого кода для изменения данных, а лишь говорит компилятору смотреть на ту же память иначе.
    - Не гарантирует переносимость кода между разными архитектурами.


Использование `(int)a` — это приведение типов в стиле языка C (**C-style cast**). В C++ оно считается плохой практикой, и вот почему:

1. Скрытая логика (Все в одном)

Когда вы пишете `(int)a`, компилятор пытается применить разные преобразования в следующем порядке, пока одно из них не сработает:

1. `const_cast` (убирает константность).
2. `static_cast` (логическое преобразование).
3. `static_cast` + `const_cast`.
4. `reinterpret_cast` (интерпретация битов).

## Ссылки

```cpp
int main(){
    int a = 1;
    int &aref = a;
    std::cout << aref;
}
```

## Двумерный массив

![Иллюстрация к теме «Двумерный массив»](assets/media/ddc17d172239a49b36.png)

@@ cpp-structs
# Структуры, объединения и измерение производительности
> Теория, примеры и иллюстрации по теме.

## Структуры, объединения

## Структура

ОПР: это одна или несколько переменных (возможно, различных
типов), которые для удобства работы с ними сгруппированы под
одним именем.

```cpp
#include <iostream>

struct Key{
int key1 = 100872;
int key2 = 26823;
};

int main() {
Key data;
std::cout << data.key1;
return 0;
}
```

c оператором `.` можно обращаться к переменным

Неименованная структура, позволяет обращаться к ее полям напрямую
```cpp
#include <iostream>
struct Key
{
	struct {
		int key1 = 100872;
		int key2 = 26823;
	};
};

Key data = {.key1 = 371235721, .key2 = 7667};

int main() {
return 0;
}
```

### Операции над структурами
- Копирования
- Присваивания
- Взятие адреса
- Доступ к элементам

### Указатель на struct

![Иллюстрация к теме «Структура»](assets/media/ddb3b9fa8d5f44df00.png)

### Выравнивание структур

Выравнивание структур в C++(alignment/padding) - это способ размещения данных в памяти для оптимизации доступа процессора.

```cpp
struct Example1 {
    char a;      // 1 байт, адрес кратен 1
    int b;       // 4 байта, должен быть выровнен по 4
};
// В памяти: [a][ ][ ][ ][b][b][b][b]
//           ↑  ↑  ↑  ↑
//           a padding (3 байта)
```

![Иллюстрация к теме «Структура»](assets/media/bd90b975d138f6032a.png)

## Объединения

- это переменная, которая может содержать (в разные моменты времени) объекты различных типов и размеров. Все требования относительно размеров и выравнивания выполняет компилятор. Объединения позволяют хранить разнородные данные в одной и той же области памяти без включения в программу машинно-зависимой информации

![Иллюстрация к теме «Объединения»](assets/media/76ee19e005ef792d50.png)

## Google Benchmark

**Google Benchmark** - это библиотека для написания и выполнения бенчмарков (тестов производительности) в C++.

@@ cpp-storage
# Представление чисел и работа с памятью
> Как данные размещаются в объектах и когда их можно использовать.

## Числа в памяти PC

LW1 :  Цифры хранятся в памяти компьютера в виде двоичного кода, представляющего собой последовательности нулей и единиц
Отрицательные числа хранятся в памяти компьютера с помощью дополнительного кода, который позволяет заменить вычитание на сложение. Для этого сначала получают прямой код положительного числа, затем инвертируют все биты (получая обратный код) и прибавляют к нему единицу. Старший бит в таком представлении становится знаковым: 0 — для положительных, 1 — для отрицательных чисел.


## Работа с памятью

На одном ядре операционная система переключает выполнение между задачами, например редактором и музыкальным проигрывателем. Планировщик может использовать аппаратные прерывания таймера. Длина кванта зависит от ОС и политики планирования.

Процесс - программа и ее ресурсы запущенные в операционной системе

У процесса есть независимое адресное пространство

У потоков СТЕК -  область памяти для потока (представь в виде тарелок только сверху ) pop push top
![Иллюстрация к теме «Работа с памятью»](assets/media/c1484a4291d6adebf9.jpeg)


Виртуальные адреса отображаются на страницы физической памяти. Отображённые области могут иметь промежутки, а соседние виртуальные страницы могут находиться в разных местах физической памяти.

Операционная система изолирует адресные пространства процессов. Для обмена данными процессы используют контролируемые механизмы, например общую память.

![Иллюстрация к теме «Работа с памятью»](assets/media/5cb29e049df4268ec3.png)

Подкачка позволяет выгружать часть страниц памяти на диск и загружать их по требованию.

Kernel Space - ядро системы
User Space - пользовательское пространство

Segment - адреса с   до  мапятся в адрес на диске
Сегмент описывает диапазон виртуальных адресов и его назначение, например отображение файла или область данных.
![Иллюстрация к теме «Работа с памятью»](assets/media/a725428f978718dbeb.png)

**Стек вызовов** хранит кадры активных функций. Доступный размер стека ограничен настройками платформы.
[Схема стека вызовов](cpp-stack-memory.html)
Heap - динамическая память или куча
1. В отличии от стека позволяет создавать динамические структуры большого размера
2. Управление жизнью объектов в куче “ручное”

![Иллюстрация к теме «Работа с памятью»](assets/media/59105df4eba4da8870.png)

Стек вызова

![Иллюстрация к теме «Работа с памятью»](assets/media/ec6518b4373bfa6c1e.png)

## Функции работы с памятью StdLib.h
### malloc

Если выделена память, она должна быть освобождена

Если программа потребляет память линейно, значит она не правильная

1. malloc не гарантирует выделение памяти
2. не забывать выставлять указатель в NULL после освобождения
3. free(NULL) ничего не делает

```cpp
#include <iostream>
#include <stdlib.h>

int main(void){
    int* ar = (int*)malloc(100000);
    std::cout << *ar << "\n";

    free(ar);
    return 0;
}
```

Когда уместно использовать кучу

**Уместно:**

- **Большие или переменные по размеру структуры**, которые не помещаются на стеке или размер известен только в рантайме (ввод `n` от пользователя, чтение файла и т.п.).

- **Время жизни данных дольше области видимости**, например, объект создаётся в функции, а используется после её завершения.

- **Полиморфизм и фабрики** — когда возвращаешь базовый интерфейс, а реальный тип решается во время выполнения (часто вместе с умными указателями).

- **Совместное владение или разделение данных** между несколькими частями программы (используй `shared_ptr`/`weak_ptr`).

- **Избежать переполнения стека** при глубокой рекурсии или огромных локальных структурах.

- **Контейнеры STL** (внутри они используют кучу): `std::vector`, `std::string`, `std::map` и др.


**Неуместно (или лучше избегать):**

- **Маленькие, краткоживущие переменные**, которые удобно положить на стек — проще, быстрее, безопаснее.

- **Ручной `new/delete` в современном C++** — предпочтительны RAII и контейнеры/умные указатели (`std::unique_ptr`, `std::make_unique`, `std::vector`).

- **Когда владение неясно** — это приводит к утечкам/двойному удалению. Если без явной причины нужен «сырой» указатель — скорее всего дизайн можно улучшить.


### calloc
Тоже самое, что и malloc только выделяет k памяти

```cpp
#include <iostream>
#include <stdlib.h>

int main(void){
    int *a = (int *)malloc(3 * sizeof(int));
    a = (int*)realloc(a, 5 * sizeof(int));

    std::cout << a << "\n";
    free(a);
    return 0;
}
```
### new

`new` выделяет память и создаёт объект, вызывая его конструктор. `malloc` выделяет необработанную память.

![Иллюстрация к теме «Функции работы с памятью StdLib.h»](assets/media/f7d1a37f9f54caf694.png)

### Segmentation fault

![Иллюстрация к теме «Функции работы с памятью StdLib.h»](assets/media/d0059002123648fa71.png)

@@ cpp-functions
# Ссылки, инициализация, перегрузка и пространства имён
> Теория, примеры и иллюстрации по теме.

## Reference, initialization, function overloading namespaces

## Ссылки (reference)

Для передачи аргументов лучше чем указатель

это тип данных
Псевданим для уже существующих объектов

int I = 10
int& j = i

При попытке создать пустую ссылку будет ошибка declared

const ссылка - запрещает менять объект и не использует доп память

Ссылка может указывать на локальный объект, пока объект жив. После выхода из его области видимости использование такой ссылки недопустимо.


![Иллюстрация к теме «Ссылки (reference)»](assets/media/14261a165416ce3db5.png)

Передача аргументов в функцию

- By reference в общем случае наиболее “дешевый” и простой способ
- By pointer *
- By value  для встроенных и небольших типов

![Иллюстрация к теме «Ссылки (reference)»](assets/media/15e628a3ac352d1106.png)

## Перегрузка функций

Это когда передается много функций одного имени

![Иллюстрация к теме «Перегрузка функций»](assets/media/6a00998b7fa521df86.png)

## Инициализация

Рекомендует использовать int {} value optimization

![Иллюстрация к теме «Инициализация»](assets/media/401817b1e97630f616.png)

## namespace

Предотвращают конфликт имён
Можно использовать одинаковые функции, но только с namespace

![Иллюстрация к теме «namespace»](assets/media/db50893906e7579cea.png)

```cpp
#include <iostream>

namespace Foo{
    void f();
}

namespace Boo{
    void f();
}

int main() {
   Foo::f();
   Boo::f();
}
```

## using

using <пространство имен> std : : element>

если в файле предпологается постоянное использование например cout

```cpp
#include <iostream>

int main(){
    using std::cout;
    cout << "using";
}
```

@@ cpp-build
# Компиляция и компоновка
> Как из нескольких файлов получается одна программа.

## Компиляция

`time g++ main.cpp` измеряет время компиляции и компоновки. Чтобы измерить запуск программы, примените `time` к исполняемому файлу.
Много файлов хорошо

![Иллюстрация к теме «Компиляция»](assets/media/027a8331c057202a71.png)

## Этапы трансляции

![Иллюстрация к теме «Этапы трансляции»](assets/media/640115ab2c40867007.png)

Препроцессор - собирает все a.h b.h относящиеся к файлу a.cpp  и собирает их в столбики
Компилятор- собирает все столбики в а.о
Линковщик - линкует в а.ехе

Можно вызывать этапы отдельно

![Иллюстрация к теме «Этапы трансляции»](assets/media/70b265b47044a088bd.png)

## Объявление и определение

Declaration - объявление int add(&a);
Definition - логика описание

![Иллюстрация к теме «Объявление и определение»](assets/media/29a14899ebd6be8d0e.png)

## Заголовочный файл

Может содержать declaration definition объявление переменных структур и const

должен содержать pragma once -  это директива препроцессора в C++, которая гарантирует, что заголовочный файл будет включен только один раз во время компиляции

## Препроцессор

Язык препроцессора - специальный ЯП встроенный в с++

У него есть директивы
Обозначаются #
include <> или ""

![Иллюстрация к теме «Препроцессор»](assets/media/351cef5ee65290ca34.png)

![Иллюстрация к теме «Препроцессор»](assets/media/97eb97e3838bd9fc59.png)
## Макросы

![Иллюстрация к теме «Макросы»](assets/media/9288526d15a5d8121c.png)

Это инструкции препроцессора
Препроцессор работает с произвольными строками не знает про синтаксис C++

difine - лучше не использовать

![Иллюстрация к теме «Макросы»](assets/media/8d79bb0b6e8fae0d9c.png)

## Стражи

![Иллюстрация к теме «Стражи»](assets/media/b608092db643ca1670.png)


## Компилятор

![Иллюстрация к теме «Компилятор»](assets/media/e125b75bc24db14ee5.png)

1. компилятор превращает в лекссхему
2. проверка правильности лекссхемы
3. оптимизации
4. код на ассемблере
5. ассемблер в машинный код
6. получаем отдельный объектный файл под каждую единицу трансляции- это столбики в препроцессоре
7. Компоновщик объединяет объектные файлы и библиотеки, связывая обращения к функциям и переменным с их определениями.

## Компоновщик(линкер)

![Иллюстрация к теме «Компоновщик(линкер)»](assets/media/a0b8d7d9a2905e5045.png)

External linkage - из всех единиц трансляции
Internal linkage - только из текущей ед. трансляции
No linkage - только текущий скоуп

![Иллюстрация к теме «Компоновщик(линкер)»](assets/media/2171c816d21fa184ba.png)

![Иллюстрация к теме «Компоновщик(линкер)»](assets/media/d1d6c72e47be21df1a.png)

## Спецификатор класса хранилища

### 1. static — статическое время жизни + внутренняя линковка

- Переменная существует **все время работы программы**.
- Если объявлена **внутри функции**, то значение **сохраняется между вызовами**.
- Если объявлена **в глобальной области**, то она **доступна только в этом файле** (internal linkage).

### 2. extern — статическое время жизни + внешняя линковка

- Переменная существует всегда (как и `static` глобальный).
- Но `extern` говорит: _переменная определена где-то в другом файле_.

### 3. threadlocal — хранение на уровне потока

У каждой нити (thread_) будет своя копия переменной.
Не общая, как у глобальных, а индивидуальная.

### 4. mutable — разрешает изменять поле объекта даже в const методах

- Помеченное поле **можно менять**, даже если объект объявлен `const`.
- Используется для скрытого состояния (кэш, счётчики).

@@ cpp-oop
# Классы, инварианты и конструкторы
> Конструирование, копирование, перегрузка операторов и владение ресурсами.

## OOP

## Абстракция

![Иллюстрация к теме «Абстракция»](assets/media/9d8506347ba1a7bf60.png)

## Инвариант

![Иллюстрация к теме «Инвариант»](assets/media/ad23a35bb1d9d151cc.png)

## Class 1) Инкапсуляция

Это парадигма с++ как есть функциональное так есть и ООП
![Иллюстрация к теме «Class 1) Инкапсуляция»](assets/media/b2b5e1fa0800ec4878.png)
![Иллюстрация к теме «Class 1) Инкапсуляция»](assets/media/a0003bd30d7613036e.png)

```cpp
#include <iostream>

class Human {
public:
    int age = 18;
    char name[10] = {"Alex"};
};
int main() {
    Human Name;

    std::cout << Name.age << '\n';
    std::cout << Name.name << '\n';
}
```

```cpp
#include <iostream>

class Human {
public:
    int age = 18;
    std::string name;
};

int main() {
    Human Name1;

    Name1.age = 18;
    Name1.name = "Alex";
    std::cout << Name1.age << '\n';
    std::cout << Name1.name << '\n';

    Human Name2;

    Name2.age = 20;
    Name2.name = "Gosha";
    std::cout << Name2.age << '\n';
    std::cout << Name2.name << '\n';
}
```

### метод - функция принадлежащая классу

Метод с квалификатором `const` не может изменять обычные поля объекта. Поля с `mutable` составляют исключение.

Если метод можно сделать const значит он обязательно должен быть const иначе будет ошибка в лабе

```cpp
#include <iostream>

class Human {
public:
    int age = 18;
    std::string name;

    void Print() { // Метод
        std::cout << name << '\t' << age << '\n';
    }
};

int main() {
    Human Name1;
    Name1.age = 18;
    Name1.name = "Alex";

    Name1.Print();
}
```

![Иллюстрация к теме «Class 1) Инкапсуляция»](assets/media/5bb6dcdc4f27793d37.png)

### Поля доступа
public - можно использовать вне класса
private - только внутри класса

по умолчанию все поля private

![Иллюстрация к теме «Class 1) Инкапсуляция»](assets/media/264956409a067b4786.png)

```cpp
#include <iostream>

class Human {
private:
    int age = 18;
    std::string name = "Alex";

public:
    void Print() {
        std::cout << name << '\t' << age << '\n';
    }
};

int main() {
    Human Name;
    Name.Print();
}
```

### Геттеры и Сеттеры

```cpp
#include <iostream>

class Human {
private:
    int age = 18;
    std::string name = "Alex";
public:
    int Get(){
        return age;
    }

    void Set(int set_age) {
        age = set_age;
    }

    void Print() {
        std::cout << age << '\n';
    }
};

int main() {
    Human Name;

    // GETTER
    int result = Name.Get();
    std::cout << result << '\n';

    // SETTER
    int new_age = 19;
    Name.Set(new_age);
    Name.Print();
}
```

### Конструктор

Чтобы создать объект класса без мусора в начале и чтобы избежать бесконечных getterov and setter

![Иллюстрация к теме «Class 1) Инкапсуляция»](assets/media/8fb5a032971de583fc.png)

Поля  — это переменные, объявленные внутри класса, которые хранят данные объекта

Конструктор - вызывается по имени класса

```cpp
#include <iostream>

class Human {
private:
    int age;
    std::string name;

public:
	// Конструктор
    Human (int value_age, std::string ind_name){
        age = value_age;
        name = ind_name;
    }

    int Get(){
        return age;
    }

    void Set(int set_age) {
        age = set_age;
    }

    void Print() {
        std::cout << age << '\n';
    }

};

int main() {
    Human Name(18, "Alex"); // Конструктор
    int new_age = 19;

    // GETTER
    int result = Name.Get();
    std::cout << result << '\n';

    // SETTER
    Name.Set(new_age);
    Name.Print();
}
```

Если поле приватное ставим value_

#### конструктор по умолчанию
вызывается при создании объекта класса и ничего не делает

`Human Name;`

#### конструктор копирования

реализуется неявно если не задано ничего

Запускается при копировании класса в функцию

```cpp
#include <iostream>

class MyClass {
public:
    int* data = new int[size];
    MyClass(int size){ // Constructor
        std::cout << "Constructor called" << '\n';
        this->size = size;

        for (int i = 0; i < size; i++) {
            data[i] = i;
        }
    }

    ~MyClass(){ // Destructor
        std::cout << "called Destructor" << '\n';
        delete[] data;
    }

private:
    int size;
};

int main() {
    MyClass Hello(10);
    MyClass Hello2(Hello);
}
```

```
Constructor called
Copy called
called Destructor
called Destructor
```

При поверхностном копировании владеющего указателя оба объекта обращаются к одному ресурсу.
При уничтожении обоих объектов один и тот же ресурс освобождается повторно. Копирующий конструктор должен создать отдельную копию ресурса либо копирование нужно запретить.

```cpp
#include <iostream>

class MyClass {
public:
    int* data;
    int copy_size;

    MyClass(int size){ // Constructor
        std::cout << "Constructor called" << '\n';
        this->data = new int[size];
        this->copy_size = size;

        for (int i = 0; i < size; i++) {
            data[i] = i;
        }
    }

    MyClass(const MyClass& other){ //Copy called
        std::cout << "Copy called" << '\n';
        this->data = new int[other.copy_size];
        for (int i = 0; i < other.copy_size; i++){
            other.data[i] = i;
        }
    }

    ~MyClass(){ // Destructor
        std::cout << "called Destructor" << '\n';
        delete[] data;
    }
};

int main() {
    MyClass Hello(10);
    MyClass Hello2(Hello);
}
```

```
Constructor called
Copy called
called Destructor
called Destructor
```

В этом примере копирование создаёт самостоятельную копию ресурса.

Это по умолчанию
```cpp
MyClass(const MyClass& other){
        this->data = other.data;
    }
```
## Деструктор

Когда выполнение выходит из области видимости в `main`, автоматически вызываются деструкторы локальных объектов.

Деструктор не принимает параметры

```cpp
#include <iostream>

class MyClass {
public:
    MyClass(){ // Constructor
        std::cout << "called constructor" << '\n';
    }
    ~MyClass(){ // Destructor
        std::cout << "called Destructor" << '\n';
    }
};

int main() {
    MyClass a;
}
```

```
called constructor
called Destructor
```
## Указатель this

`this` — указатель на текущий объект внутри нестатического метода.

```cpp
#include <iostream>

class MyClass {
public:
    MyClass(){ // Constructor
        std::cout << this << " called constructor" << '\n';
    }
    ~MyClass(){ // Destructor
        std::cout << this << " called Destructor" << '\n';
    }

private:
    int age;
    std::string name;
};

int main() {
    MyClass a;
}
```

```
0x7fff623adc90 called constructor
0x7fff623adc90 called Destructor
```

```cpp
#include <iostream>

class MyClass {
public:
    MyClass(int new_age, std::string new_name){ // Constructor
        age = new_age;
        name = new_name;
        std::cout << this->age << '\n';
        std::cout << this->name << '\n';
    }

    ~MyClass(){ // Destructor
        std::cout << "called Destructor" << '\n';
    }

private:
    int age;
    std::string name;
};

int main() {
    MyClass Hello(18, "Alex");
}
```

```
18
Alex
called Destructor
```

```cpp
#include <iostream>

class MyClass {

public:
    MyClass(int new_age, std::string new_name){ // Constructor
        age = new_age;
        name = new_name;
    }

    ~MyClass(){ // Destructor
        std::cout << "called Destructor" << '\n';
    }

    void Get() {
        std::cout << this->age << '\n';
    }

    void Set(int age) {
        this->age = age; // this->age обозначает поле, age — параметр конструктора
    }

private:
    int age;
    std::string name;
};

int main() {
    MyClass Hello(18, "Alex");
    Hello.Get();

    Hello.Set(20);
    Hello.Get();
}
```


![Иллюстрация к теме «This»](assets/media/fd070be1f1abf1171d.png)

## explicit

`explicit` - означает явное указание компилятору, что конструктор или оператор преобразования не должен использоваться для **неявного** (автоматического) преобразования типов, что предотвращает ошибки и неожиданное поведение

## Правило трех и пяти

![Иллюстрация к теме «Правило трех и пяти»](assets/media/63f3448a0562065f58.png)

![Иллюстрация к теме «Правило трех и пяти»](assets/media/84bd2f3a25cad0f9b5.png)

@@ cpp-operators
# Перегрузка операторов
> Теория, примеры и иллюстрации по теме.

## Перегрузка функции методов и операторов

Перегрузка операторов позволяет задать операции для объектов пользовательских типов, например сравнение и сложение.
## Перегрузка =

```cpp
#include <iostream>

class MyClass {
public:
    int* data;
    int copy_size;

    MyClass(int size) { // Constructor
        std::cout << "Constructor called\n";
        data = new int[size];
        copy_size = size;

        for (int i = 0; i < size; i++) {
            data[i] = i;
        }
    }

    MyClass(const MyClass& other) { // Copy constructor
        std::cout << "Copy called\n";
        copy_size = other.copy_size;
        data = new int[copy_size];
        for (int i = 0; i < copy_size; i++) {
            data[i] = other.data[i];
        }
    }

    MyClass& operator=(const MyClass& other) { // Copy assignment
        std::cout << "Operator= called\n";

        if (this == &other) {
            return *this; // защита от самоприсваивания
        }
        delete[] data;

        // Копируем размер и данные
        copy_size = other.copy_size;
        data = new int[copy_size];
        for (int i = 0; i < copy_size; i++) {
            data[i] = other.data[i];
        }
        return *this;
    }

    ~MyClass() { // Destructor
        std::cout << "called Destructor\n";
        delete[] data;
    }
};

int main() {
    MyClass a(10);
    MyClass b(5);
    a = b;
}
```

## Перегрузка `==` и `!=`

![Иллюстрация к перегрузке операторов сравнения](assets/media/00fe76cbcb3303a740.png)

```cpp
 bool operator== (const Point& other) {
        return this->x == other.x && this->y == other.y;
    }
```
and
```cpp
 bool operator!= (const Point& other) {
        return !(this->x == other.x && this->y == other.y);
    }
```

## Перегрузка + - / *

```cpp
 int operator+(const Point& other) {
        return this->x + other.x + this->y + other.y;
    }

   int answer = (a + b);
```

А если нужно так  ----------- Point c = a + b;
```cpp
 Point operator+(const Point& other){
        Point temp;
        temp.x = this->x + other.x;
        temp.y = this->y + other.y;
        return temp;
    }
```

## Перегрузка ++ -- ...

```cpp
 Point& operator++() {
        this->x++; // or
        this->y += 1;
        return *this;
    }

  ++a;
```

А если нужно a++
```cpp
Point& operator++(int value) {
        this->x++; // or
        this->y += 1;
        return *this;
    }
```

А если так Point b = a++;
```cpp
 Point operator++(int value) {
        Point temp(*this);
        this->x++;
        this->y++;
        return temp;
    }
```

## Перегрузка []

```cpp
#include <iostream>
class Test {
public:
    int& operator[](int index){
        return arr[index];
    }
private:
    int arr[5]{1, 2, 3, 4, 5};
};

int main() {
    Test a;
    std::cout << a[1] << '\n';
}
```


Операторы:
Арифмитические
Битовые
Логические
Перегрузка операторов:
Операторы .... нельзя перегружать
ostream - глобальный поток вывода для cout и

@@ cpp-raii
# RAII и реализация учебного класса строки
> Теория, примеры и иллюстрации по теме.

## Идиома RAII

[Идиома RAII](https://en.wikipedia.org/wiki/Resource_acquisition_is_initialization) (Resource Acquisition Is Initialization) переводится как «захват ресурса должен быть инициализацией объекта». Пусть программе требуется какой-то ресурс (память, файл), который надо обязательно «вернуть», когда он будет уже не нужен. Идея состоит в том, что лучше всего запрашивать этот ресурс в конструкторе некоторого объекта, а освобождать — в деструкторе. На этой идее построены стандартные контейнеры и так называемые «умные указатели» — классы `unique_ptr` и `shared_ptr` из стандартной библиотеки.

![Иллюстрация к теме «Идиома RAII»](assets/media/ff3403a06790e1213b.png)

- Обеспечивает инкапсуляцию ресурса и инвариант состояния
- Захват ресурса есть его инициализация
- к указателям, мьютексам, файлам
При использовании ресурса обеспечьте его освобождение по завершении работы. RAII связывает освобождение со временем жизни владельца.

## Свой мини класс стринг

```cpp
#include <iostream>
#include <cstring>

class MyString {
private:
    char* str;
public:
    MyString() {
        str = nullptr;
    }

    MyString(char* str) {
        int len = strlen(str);
        this->str = new char[len];

        for (int i = 0; i < len; i++) {
            this->str[i] = str[i];
        }

        this->str[len] = '\0';
    }

    ~MyString() {
        delete[] this->str;
    }

    void Print() {
        std::cout << str << '\n';
    }
};

int main() {
    MyString str("Hello");
    str.Print();
}
```

@@ cpp-polymorphism
# Наследование и полиморфизм
> Виртуальные методы, интерфейсы и безопасное удаление объектов.

## ООП: Наследование

## friend function

Позволяет описать новый класс на основе уже существующих

Обеспечивает повторное использование кода

class CStudent : public CPerson
Дочерний Базовый

![Иллюстрация к теме «friend function»](assets/media/53a6ce860ba55c8466.png)
## friend class

Позволяет описать новый класс на основе уже существующих

Обеспечивает повторное использование кода

class CStudent : public CPerson
Дочерний Базовый

![Иллюстрация к теме «friend class»](assets/media/bc89e7ba470a2e0904.png)

Наследник:
Объект производного класса содержит подобъект базового класса.
Сохраняйт методы родителя*
Модификаторы доступа

Сначала вызывается конструктор от базовых к дочерним
Деструктор от дочерних к базовым (в обратном порядке)

protected - можно использовать поля в дочерних, но нельзя, как в public использовать в main

Конструктор Базового класса будет вызываться каждый раз, когда будет вызываться дочерний

## Final

Спецификатор `final` запрещает наследоваться от помеченного класса или переопределять помеченный виртуальный метод.
class MyClass final

![Иллюстрация к теме «Final»](assets/media/30d62177f5dd9c9445.png)

![Иллюстрация к теме «Final»](assets/media/ff911990db2c780dfd.png)


Посмотри как задавать конструктор и деструктор

Ромбовидное наследование -
Почитай

## Полиморфизм virtual override

Полиморфизм — это возможность использовать классы – потомки в контексте, который был предназначен для класса – предка.

Интерфейс - совокупность методов класса

Статическая память - известна на этапе компиляции

override - переопределить
Virtual - какой-то метод является виртуальной и его можно будет переопределить в классе наследнике

```cpp
#include <iostream>

class Gun {
public:
    virtual void Shot(){
        std::cout << "boom\n";
    }
};

class SubGun : public Gun {
public:
    void Shot() override {
        std::cout << "Bang\n";
    }
};

int main() {
    Gun gun;
    SubGun mash;
    Gun *weapon = &mash;
    weapon->Shot();
}
```

Ключевое слово virtual  помогает переопределить метод исходного класса и использовать его с другими данными
```cpp
#include <iostream>

class Bazooka {
public:
    virtual void Shot(){
        std::cout << "boom\n";
    }
};

class SubGun : public Bazooka {
public:
    void Shot() override {
        std::cout << "Bang\n";
    }
};

class Player {
public:
    void Shot(Bazooka*gun) {
        gun->Shot();
    }
};

int main() {
    Bazooka gun;
    SubGun gun1;
    Player p;

    p.Shot(&gun1);
}
```


Строится таблица виртуальной функции, где находится все виртуальные методы. С помощью этой таблицы можно искать ячейки в памяти и использовать их из дочернего класса

override - метод будет работать с виртуальными методами

Если метод final то override запрещён

Виртуальный деструктор позволяет корректно уничтожать производный объект через указатель на базовый класс.

При вызове виртуального метода через указатель или ссылку базового типа выбирается реализация, соответствующая фактическому типу объекта.


Таблица хранится в коде в которой хранятся реальный мапинг...

Полиморфизм - позволяет работать с разными типами данных

![Иллюстрация к теме «Полиморфизм virtual override»](assets/media/55802c28d46eae87bc.png)

@@ cpp-oop-principles
# Четыре принципа ООП
> Теория, примеры и иллюстрации по теме.

## Все 4 принципа ООП

![Иллюстрация к теме «Все 4 принципа ООП»](assets/media/a0003bd30d7613036e.png)

Наследование — это возможность порождать один класс от другого с сохранением всех свойств и методов класса-предка (суперкласса), добавляя при необходимости новые свойства и
методы.

Полиморфизм — это возможность использовать классы – потомки в контексте, который был предназначен для класса – предка.

@@ cpp-templates
# Шаблоны, специализация и vector
> Обобщённые функции, классы и динамический массив.

## Шаблоны С++  not OOP

Избавление от перегрузки для разных типов данных

Шаблоны помогают работать с разными типами данных
Определяет целое семейство функции или классов
"Шаблонная функция"

class тип данных, который называется T

![Иллюстрация к теме «Шаблоны С++  not OOP»](assets/media/c34fcdade2cf54c6c8.png)

## Шаблонные могут быть
Класс, функция, метод

```cpp
#include <iostream>

template <typename T>
const T& max(T& a, T& b) {
    return a > b ? a : b;
}

int main() {
    int a = 10;
    int b = 15;
    std::cout << max(a, b);
}
```

![Иллюстрация к теме «Шаблонные могут быть»](assets/media/ef5a74152f82d71467.png)
Если оба параметра используют один тип T, вывод типа должен дать одинаковый результат для обоих аргументов. Тип также должен поддерживать операции из тела шаблона.

Аргументом шаблона может быть вызываемый объект.

![Иллюстрация к теме «Шаблонные могут быть»](assets/media/0404fc42fdd2babdbd.png)
При инстанцировании компилятор подставляет аргументы шаблона и формирует конкретную специализацию.

![Иллюстрация к теме «Шаблонные могут быть»](assets/media/4279e9919b30ff5c53.png)

Инстанцирование происходит во время компиляции. Например, вызов с аргументом int может создать специализацию шаблонной функции для int.

![Иллюстрация к теме «Шаблонные могут быть»](assets/media/c46c479752fae04763.png)

```cpp
#include <iostream>

template<class T, class B>
void Swap(T& x, B& y) {
    std::swap(x, y);
}

int main() {
    int x = 10;
    int y = 11;
    Swap(x, y);
    std::cout << x;
}
```

## Когда применять class и typename

В объявлении параметра типа `template <class T>` и `template <typename T>` эквивалентны.
## Шаблон класса

![Иллюстрация к теме «Шаблон class»](assets/media/b47fcc26a10f455d54.png)

Методы класса тоже могут быть шаблонными.

![Иллюстрация к теме «Шаблон class»](assets/media/42c910822139258fc4.png)

![Иллюстрация к теме «Шаблон class»](assets/media/96fd67611431a8bbe0.png)

При выводе аргументов шаблона класса (CTAD, C++17) компилятор может вывести параметры из аргументов конструктора.

Шаблоны и перегрузки поддерживают статический полиморфизм. Виртуальные методы поддерживают динамический полиморфизм.
## Vector

Динамический массив, который сам следит за выделением памяти и может удалять добавлять

![Иллюстрация к теме «Vector»](assets/media/b534177df3066181cb.png)

## Специальные шаблоны

Позволяет писать шаблонный код, но делать специальные инстанциации для конкретного типа

Специализация не живёт без основного шаблона
Полная специализация задаёт реализацию для конкретного набора аргументов шаблона.

Для объявления типового параметра допустимы class и typename. Соблюдайте стиль проекта.

ЧАСТИЧНАЯ СПЕЦИАЛИЗАЦИЯ

Для метода класса

Виды: полная полностью -  определяем все шаблонные типы
При частичной специализации фиксируют часть параметров или задают шаблон для их формы. Например, специализация может обрабатывать все пары, первый тип которых — `int`.

Умный указатель
unique_ptr


---

@@ cpp-stack-memory
# Стек вызовов
> Теория, примеры и иллюстрации по теме.

## Материалы и примеры по пунктам

Кадры вызовов и локальные объекты

Старшие адреса

### LIFO

i

arr

Последним добавлен, первым извлечён

Указатель стека поддерживается архитектурой

Вершина стека

CPU

Указатель стека

Младшие адреса

## Схемы и рукописные примеры

![Схема к теме «Стек вызовов», часть 1](assets/media/stack-cpp-stack-memory-1.webp)

@@ cpp-heap-memory
# Динамическая память и фрагментация
> Теория, примеры и иллюстрации по теме.

## Материалы и примеры по пунктам

При необходимости аллокатор запрашивает дополнительную память

дефрагментация

Объём динамической памяти ограничен ресурсами процесса

После освобождения блоков между занятыми областями могут остаться свободные промежутки.

(Garbage Collector) — это сборщик мусора, механизм автоматического управления памятью в программировании, который находит и освобождает ненужные объекты

## Схемы и рукописные примеры

![Схема к теме «Динамическая память и фрагментация», часть 1](assets/media/heap-cpp-heap-memory-1.webp)
