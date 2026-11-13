@@ cpp-ownership
# Умные указатели
> Единственный владелец, совместное владение и наблюдение за объектом.

## Умные указатели

<https://habr.com/ru/companies/piter/articles/706866/>

Умные указатели были созданы для устранения утечек памяти. По сути, они обеспечивают автоматическое управление памятью: когда умный указатель больше не используется, то есть выходит из области видимости, память, на которую он указывает, автоматически высвобождается. Традиционные указатели теперь также называют «обычными» указателями.

На самом деле это просто классы, которые оборачивают обычный указатель в свои недра и перегружают операторы -> и *. Благодаря этому трюку умный указатель имеет тот же синтаксис, что и обычный указатель. Когда умный указатель выходит из области видимости, срабатывает его деструктор и происходит очистка памяти. Эта техника называется Resource Acquisition Is Initialization (RAII): класс оборачивает динамический ресурс (файл, сокет, подключение к базе данных, выделенная память, ...), который должным образом удаляется/закрывается в своем деструкторе. Таким образом, вы гарантированно избежите утечки ресурсов.

## Типы умных указателей в современном C++

- std::unique_ptr — умный указатель, владеющий динамически выделенным ресурсом;
- std::shared_ptr — умный указатель, владеющий разделяемым динамически выделенным ресурсом. Несколько std::shared_ptr могут владеть одним и тем же ресурсом, и внутренний счетчик ведет их учет;
- std::weak_ptr — подобен std::shared_ptr, но не увеличивает счетчик.

auto_ptr - древний предок unique_ptr запрещен в новом стандарте (не умеет копировать указатель)

### std::unique_ptr

std::unique_ptr владеет объектом, на который он указывает, и никакие другие умные указатели не могут на него указывать. Когда std::unique_ptr выходит из области видимости, объект удаляется. Это полезно, когда вы работаете с временным, динамически выделенным ресурсом, который может быть уничтожен после выхода из области действия.

**Как создать std::unique_ptr**

```
std::unique_ptr<Type> p(new Type);
```

Также можно создать std::unique_ptrs с помощью специальной функции std::make_unique, вот так:

```
std::unique_ptr<Type> p = std::make_unique<Type>(...размер или параметры...);
```

Если есть возможность, всегда старайтесь выделять объекты с помощью std::make_unique.

```cpp
class Robot {
private:
    std::string name;
public:
    Robot(std::string& n) {
        this->name = n;
        std::cout << "Robot " << n << " created" << '\n';
    }
    ~Robot() {
        std::cout << "Robot "<< this->name << " destroyed" << '\n';
    }
    void speak() {
        std::cout << "Hello, I am " << this->name << '\n';
    }
};

int main() {
    std::string name1 = "Valera";
    std::string name3 = "Sisa";
    std::string name2 = "Epchtain";
    std::vector<std::unique_ptr<Robot>> vec;
    vec.push_back(std::make_unique<Robot>(name1));
    vec.push_back(std::make_unique<Robot>(name2));
    vec.push_back(std::make_unique<Robot>(name3));
    for (auto& i : vec) {
        i->speak();
    }
}
```

Почему std::unique_ptr нельзя копировать?
Потому что он **гарантирует единственного владельца ресурса**.
### std::shared_ptr

std::shared_ptr владеет объектом, на который он указывает, но, в отличие от std::unique_ptr, он допускает множественные ссылки. Специальный внутренний счетчик уменьшается каждый раз, когда std::shared_ptr, указывающий на тот же ресурс, выходит из области видимости. Эта техника называется подсчетом ссылок. Когда последняя из них будет уничтожена, счетчик станет равным нулю, и данные будут высвобождены.

распространённый подход  automatic reference counter

счетчик хранится в control_block

Умный указатель такого типа полезен, когда требуется обмениваться динамически распределенными данными, точно так же, как это делается с обычными указателями или ссылками.

```
std::shared_ptr<Type> p(new Type);
```

```
std::shared_ptr<Type> p = std::make_shared<Type>(...parameters...);
```

Одна из главных особенностей std::shared_ptr — возможность отслеживать, сколько указателей ссылаются на один и тот же ресурс. Получить информацию о количестве ссылок можно с помощью метода use_count().

Для чего вообще нужен `std::shared_ptr`?
`std::shared_ptr` подходит для совместного владения, когда заранее неизвестно, какой владелец освободит объект последним.

```cpp
class Person {
private:
    std::string name;
public:
    Person(std::string name) {
        std::cout << "called constr " << name << '\n';
    }
    ~Person() {
        std::cout << "called distr " << name << '\n';
    }
};

void PrintPerson(std::shared_ptr<Person> p) {
    std::cout << p.use_count() << '\n';
}

int main() {
    std::shared_ptr<Person> p = std::make_shared<Person>("Dima");
    std::shared_ptr<Person> t = std::move(p);
    std::cout << t.use_count() << '\n';
    PrintPerson(t);
    std::cout << t.use_count() << '\n';
}

called constr Dima
1
2
1
called distr
```
### weak_ptr

std::weak_ptr — это, по сути, std::shared_ptr, который не увеличивает счетчик ссылок. Он определяется как умный указатель, который содержит несобственную ссылку, или ослабленную ссылку, на объект, управляемый другим std::shared_ptr.

Этот умный указатель полезен для решения некоторых раздражающих проблем, которые нельзя решить с помощью необработанных указателей.

только от shared_ptr в момент возникновения цикла

С помощью std::weak_ptr очень легко решить проблему висящих указателей — тех, которые указывают на уже удаленные данные. Он предоставляет метод expired(), который проверяет, был ли объект, на который ссылается ссылка, уже удален. Если expired()  true, исходный объект был где-то удален, и вы можете действовать соответствующим образом. Это то, что вы не можете сделать с необработанными указателями.

```cpp
int main() {
    std::shared_ptr<int> sp = std::make_shared<int>(42);
    std::weak_ptr<int> wp = sp;  // weak_ptr не владеет объектом

    std::cout << "use_count: " << sp.use_count() << std::endl; // 1

    if (auto locked = wp.lock()) {   // пытаемся получить shared_ptr
        std::cout << "Value: " << *locked << std::endl;
    }

    sp.reset();  // удаляем последний shared_ptr

    if (wp.expired()) {
        std::cout << "Object deleted\n";
    }

    if (auto locked = wp.lock()) {
        std::cout << "Won't print\n";
    } else {
        std::cout << "Cannot access object anymore\n";
    }

    return 0;
}
```

### std::enable_shared_from_this

Он позволяет функциям-членам класса, экземпляр которого создан в std::shared_ptr, получить дополнительные сильные (shared_from_this()) или слабые (weak_from_this(), начиная с C++17) копии того std::shared_ptr, в котором он был создан. Вызывать shared_from_this() и weak_from_this() из конструктора и деструктора нельзя.

Из сырого объекта получать копию shared_ptr

![Иллюстрация к теме «Типы умных указателей в современном C++»](assets/media/105f913d441baa89f2.png)

@@ cpp-stl
# STL, итераторы и алгоритмы
> Контейнеры, полуоткрытые диапазоны и выбор операций.

## STL итераторы и основные алгоритмы

![Иллюстрация к теме «STL итераторы и основные алгоритмы»](assets/media/db3c479b164fb64173.png)

Контейнер [std::array](https://www.google.com/search?q=std%3A%3Aarray&oq=%D1%87%D1%82%D0%BE+%D1%82%D0%B0%D0%BA%D0%BE%D0%B5+%D0%BA%D0%BE%D0%BD%D1%82%D0%B5%D0%BD%D0%B5%D1%80+array&gs_lcrp=EgZjaHJvbWUyBggAEEUYOdIBCjEwNzk4ajBqMTWoAgiwAgE&sourceid=chrome&ie=UTF-8&ved=2ahUKEwiSmobJxdSSAxXeDRAIHf2xL_EQgK4QegQIARAB) в C++ (STL) — это безопасная и удобная обёртка над обычными статическими массивами, предоставляющая фиксированный размер, известный на этапе компиляции. Он хранит элементы одного типа в непрерывной области памяти, обычно на стеке, обеспечивая быстрый доступ по индексу, но не позволяя изменять свой размер (добавлять или удалять элементы) в ходе работы.


В контексте контейнера map (например, в C++) слово **«упорядоченный»** означает, что элементы внутри него всегда выстроены в строгом **порядке возрастания ключей**.

Обычно упорядоченный `map` реализован в виде **красно-черного дерева** (сбалансированного бинарного дерева поиска). Именно структура дерева поддерживает этот порядок при каждой вставке.

порядок возрастания ключей

![Иллюстрация к теме «STL итераторы и основные алгоритмы»](assets/media/c50c80f9fc9b5373bb.png)

```cpp
int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5, 6};
    for (auto i = vec.begin(); i < vec.end(); i++) {
        std::cout << *i << ' ';
    }
}
```

```cpp
int main() {
    std::map<std::string, int> map = {{"Alice", 18}, {"Bob", 200}};
    for (auto it = map.cbegin(); it != map.cend(); it++) {
        std::cout << it->first << ' ';
    }
}


int main() {
    std::string a = "этот день был этот день когда мы ждали мы ждали";
    std::map<std::string, int> t;
    std::stringstream ss(a);
    std::string temp;
    int count = 1;
    while (ss >> temp) {
        t[temp]++;
    }
}
```

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> vec = {1, 2, 3, 4};
    std::reverse(vec.begin(), vec.end());
    for (auto i = vec.cbegin(); i < vec.cend(); i++) {
        std::cout << *i << ' ';
    }
}
```

![Иллюстрация к теме «STL итераторы и основные алгоритмы»](assets/media/11a40c037c324d6a7e.png)

![Иллюстрация к теме «STL итераторы и основные алгоритмы»](assets/media/3ac8605b520ea04cd4.png)
![Иллюстрация к теме «STL итераторы и основные алгоритмы»](assets/media/3fffd1aa0c508a5276.png)

![Иллюстрация к теме «STL итераторы и основные алгоритмы»](assets/media/b8a443962f2b248685.png)
![Иллюстрация к теме «STL итераторы и основные алгоритмы»](assets/media/5c419d4bcc94dd84a6.png)

## Итераторы с произвольным доступом

Итератор с произвольным доступом поддерживает смещение на заданное число позиций за O(1).

![Иллюстрация к теме «Итераторы с произвольным доступом»](assets/media/a7543a88a872f6fbea.png)

это операции с ними

## Непрерывный итератор

![Иллюстрация к теме «Непрерывный итератор»](assets/media/18dd00b2eb6aac6163.png)

`std::addressof` — это шаблонная функция в C++ (определена в заголовке `<memory>`), которая возвращает точный адрес объекта, даже если для его класса перегружен оператор взятия адреса `operator&`. Она гарантирует получение указателя на объект , избегая перегруженных операторов, что критично для безопасной работы обобщенного кода.


![Иллюстрация к теме «Непрерывный итератор»](assets/media/109dbc23d9846d7ea4.png)

## iterator / const_iterator

cbegin cend

## Итератор

![Иллюстрация к теме «Итератор»](assets/media/f6e57c592d7c1e0a89.png)
![Иллюстрация к теме «Итератор»](assets/media/ae8c11d77ff6f94a57.png)
![Иллюстрация к теме «Итератор»](assets/media/e878ec661f0d5f6070.png)
![Иллюстрация к теме «Итератор»](assets/media/164ec2acc381bd0d6d.png)

## NB
std::find
std::greater<>

## Обобщенные числовые алгоритмы

![Иллюстрация к теме «Обобщенные числовые алгоритмы»](assets/media/ff8d6753e341a4d62e.png)

## Алгоритмы с предикатами

`std::sort( v1.begin(), v1.end(), greater());`
выполняет сравнение двух элементов на «больше» (`x > y`).

`std::sort( v1.begin(), v1.end(), std::less());`
выполняет операцию «меньше» (`<`) над двумя аргументами.
## Неизменяющие алгоритмы

![Иллюстрация к теме «Неизменяющие алгоритмы»](assets/media/1c8e51433e893bae0c.png)

### find и find_if

`std::find_if` — это алгоритм стандартной библиотеки C++ (STL), предназначенный для поиска первого элемента в диапазоне, удовлетворяющего заданному условию (предикату).

```cpp
int main() {
    std::vector<int> v = {1, 3, 5, 8, 10};
    // Поиск первого четного числа
    auto it = std::find_if(v.begin(), v.end(), [](int i) { return i % 2 == 0; });

    if (it != v.end()) {
        std::cout << "Найдено: " << *it << std::endl; // Выведет 8
    }
    return 0;
}
```

### count и count_if

![Иллюстрация к теме «Неизменяющие алгоритмы»](assets/media/b40d880b3a140e33b7.png)

```cpp
int predicat(int& x) {
    return x % 2 == 0;
}

int main() {
    std::vector<int> a = {1, 3 , 4};
    auto i = std::count_if(a.begin(), a.end(), predicat);
    std::cout << i;
}
```

### std::for_each

`std::for_each` в C++ — это алгоритм из библиотеки `<algorithm>`, применяющий заданную функцию (или лямбду) к каждому элементу в диапазоне (контейнере).

```cpp
void predicat(int& x) {
    x += 10;
}

int main() {
    std::vector<int> a = {1, 2, 3 , 4};
    std::for_each(a.begin(), a.end(), predicat);
    for (int i : a) {
        std::cout << i << ' ';
    }
}
```

### `std::mismatch`
`std::mismatch` в C++ — это алгоритм из стандартной библиотеки (`<algorithm>`), предназначенный для сравнения двух диапазонов данных и поиска первого места, где элементы различаются.

```cpp
int main() {
    std::vector<int> a = {1, 3, 4};
    std::vector<int> b = {1, 2, 5};
    auto i = std::mismatch(a.begin(), a.end(), b.begin());
    std::cout << *(i.first) << ' ' << *(i.second);
}
```

### std::equal
`std::equal` в C++ — это алгоритм из стандартной библиотеки (заголовочный файл `<algorithm>`), который используется для проверки того, равны ли элементы в двух диапазонах.

```cpp
int main() {
    std::vector<int> a = {1, 3, 4};
    std::vector<int> b = {1, 2, 5};
    if (std::equal(a.begin(), a.end(), b.begin())) std::cout << true;
    else std::cout << false;
}
```

###  search

`std::search` в C++ — это алгоритм из стандартной библиотеки (`<algorithm>`), предназначенный для поиска первого вхождения одной последовательности элементов (подпоследовательности) внутри другой.

std::distance — это функция из `<iterator>`, которая вычисляет **расстояние между двумя итераторами.

```cpp
int main() {
std::vector<int> a = {1, 3, 4};
std::vector<int> b = {1, 3};

auto it = std::search(a.begin(), a.end(),
b.begin(), b.end());

if (it != a.end()) {
	int index = std::distance(a.begin(), it);
	std::cout << "Found at index: " << index << "\n";
} else {
	std::cout << "Not found\n";
}
}
```

## Изменяющие алгоритмы

![Иллюстрация к теме «Изменяющие алгоритмы»](assets/media/31625156f0e8305733.png)

### copy

```cpp
int main() {
std::vector<int> a = {1, 3, 4};
std::vector<int> b(a.size()); // создаём нужный размер

std::copy(a.begin(), a.end(), b.begin());

for (int i : b) {
	std::cout << i << " ";
}
}
```

### copy_backward

**`std::copy_backward`** в C++ — это алгоритм из стандартной библиотеки (заголовочный файл `<algorithm>`), предназначенный для копирования элементов из одного диапазона в другой, начиная с конца исходного диапазона и двигаясь к началу.

```cpp
int main() {
    std::vector<int> a = {1, 3, 4};
    std::vector<int> b(a.size() + 5);
    std::copy_backward(a.begin(), a.end(), b.end());
    for (int i : b) {
        std::cout << i;
    }
}
```

### fill \ fill_n

заполняет значения
![Иллюстрация к теме «Изменяющие алгоритмы»](assets/media/3934890069d19fde25.png)

Главное отличие заключается в **способе указания диапазона заполнения**: `std::fill` использует пару итераторов (начало и конец), а `std::fill_n` использует начальный итератор и счетчик элементов.

### generate

![Иллюстрация к теме «Изменяющие алгоритмы»](assets/media/3844ffd08e4db4f41c.png)

### partition

В C++ [std::partition](https://www.google.com/search?q=std%3A%3Apartition&sca_esv=ad335200c38ab265&biw=1536&bih=695&sxsrf=ANbL-n6dM_7rtPjZgI6i4z1xG_iFLo4c8g%3A1771851833516&ei=OVCcafybH621wPAPp42XiA8&ved=2ahUKEwjl8PKn2e-SAxUWMRAIHaEaMvwQgK4QegQIARAB&uact=5&oq=partition+%D1%87%D1%82%D0%BE+%D1%82%D0%B0%D0%BA%D0%BE%D0%B5+%D1%81%2B%2B&gs_lp=Egxnd3Mtd2l6LXNlcnAiIHBhcnRpdGlvbiDRh9GC0L4g0YLQsNC60L7QtSDRgSsrMgUQIRifBUiPQFAAWIA-cAB4AZABAJgBuwGgAdwYqgEEMC4yM7gBA8gBAPgBAZgCF6AC0BnCAgsQABiABBixAxiDAcICBRAAGIAEwgIOEC4YgAQYsQMYxwEYrwHCAg4QLhiABBixAxjRAxjHAcICCBAAGIAEGLEDwgIREC4YgAQYsQMY0QMYgwEYxwHCAgQQLhgDwgIOEC4YgAQYsQMYgwEYigXCAgQQABgDwgIOEAAYgAQYsQMYgwEYigXCAgsQLhiABBixAxiDAcICCxAuGIAEGMcBGK8BwgIFEC4YgATCAgYQABgWGB7CAggQABiABBiiBMICBRAAGO8FwgIFECEYoAHCAgQQIRgVmAMAkgcEMC4yM6AHhbcBsgcEMC4yM7gH0BnCBwYwLjUuMTjIB1SACAA&sclient=gws-wiz-serp&mstk=AUtExfAJSwEyk7k6W_LE-5B9SKPHzug1RlRbm7H2Rlhmg2VfWBytKAaM8GOBXiO27-DLb3pLcdHIvjsn9Qdv5-97FVFjgGi969BJ_rR2qadw8OHMBJn5Dybv2e_Iq6jBmqCmNNKYcCZdEGbuIq8VTAO5zjVaJZhADQAQ0deteWU09Q_LtjM&csui=3) — это алгоритм из библиотеки `<algorithm>`, который переупорядочивает элементы в диапазоне так, что элементы, удовлетворяющие условию (предикату), перемещаются в начало, а остальные — в конец.

```cpp
int predicat(int& i) {
    return i % 2 == 0;
}

int main() {
    std::vector<int> a = {1, 2, 3, 4, 5, 6};
    std::partition(a.begin(), a.end(), predicat);
    for (int& i : a) {
        std::cout << i << ' ';
    }
}
```

### std::random_shuffle

`std::random_shuffle` в C++ — это алгоритм из стандартной библиотеки (`<algorithm>`), предназначенный для случайного переупорядочивания элементов в контейнере

```cpp
int main() {
    std::vector<int> a = {1, 2, 3, 4, 5, 6};
    std::random_shuffle(a.begin(), a.end());
    for (int& i : a) {
        std::cout << i << ' ';
    }
}
```

erase\remove

![Иллюстрация к теме «Изменяющие алгоритмы»](assets/media/cd84f36277d7467cd5.png)

remove переносит элементы в конец а erase уже удаляет диапазон от..до

```cpp
int main() {
    std::vector<int> a = {0, 2, 3, 0, 5, 6, 0, 0};
    std::remove(a.begin(), a.end(), 0);
    a.erase(a.end());
    for (int& i : a) {
        std::cout << i << ' ';
    }
}

2 3 5 6 5 6 0
```

### replace

```cpp
int main() {
    std::vector<std::string> a = {"cat", "dog"};
    std::replace(a.begin(), a.end(), "cat", "dog");
    for (std::string& i : a) {
        std::cout << i << ' ';
    }
}
```

### rotate

`std::rotate` в C++ — это алгоритм из стандартной библиотеки (`<algorithm>`), который переставляет элементы в диапазоне `[first, last)` так, что элемент, указанный итератором `middle`, становится первым, а элементы до него переносятся в конец.

```cpp
int main() {
    std::vector<int> a = {1, 2, 3, 4, 5};
    std::rotate(a.begin(), a.end() - 2, a.end());
    for (int& i : a) {
        std::cout << i << ' ';
    }
}
```

### swap_ranges

```cpp
int main() {
    std::vector<int> a = {1, 2, 3, 4, 5};
    std::swap_ranges(a.begin(), a.begin() + 2, a.end() - 2);
    for (int& i : a) {
        std::cout << i << ' ';
    }
}
```

### transform

`std::transform` в C++ — это алгоритм из стандартной библиотеки (`<algorithm>`), который применяет заданную функцию (унарную или бинарную) к элементам одного или двух диапазонов и записывает результат в выходной итератор.

```cpp
int predicat(int i) {
return i * i;
}

int main() {
std::vector<int> a = {1, 2, 3, 4, 5};
std::vector<int> b(a.size());

std::transform(a.begin(), a.end(), b.begin(), predicat);

for (int i : b) {
std::cout << i << ' ';
}
}
```

### unique

`std::unique` для удаления дубликатов в контейнерах

```cpp
int main() {

    std::vector<int> a = {1, 2, 2, 2, 5};



    std::unique(a.begin(), a.end());


    for (int i : a) {
        std::cout << i << ' ';
    }
}
```
## Теоретико-множественные операции

![Иллюстрация к теме «Теоретико-множественные операции»](assets/media/c99eef614251e37492.png)

![Иллюстрация к теме «Теоретико-множественные операции»](assets/media/7395d210410a3caca7.png)

![Иллюстрация к теме «Теоретико-множественные операции»](assets/media/4c25d19393923fbdb9.png)

`std::set_union` в C++ — это алгоритм из библиотеки `<algorithm>`, который создает отсортированное объединение двух упорядоченных диапазонов.

```cpp
int main() {
    std::vector<int> v1 = {1, 2, 3, 4};
    std::vector<int> v2 = {3, 4, 5, 6};
    std::vector<int> dest;

    std::set_union(v1.begin(), v1.end(),
                   v2.begin(), v2.end(),
                   std::back_inserter(dest));
    // Результат dest: {1, 2, 3, 4, 5, 6}
    return 0;
}
```

## Обобщенные числовые алгоритмы

![Иллюстрация к теме «Обобщенные числовые алгоритмы»](assets/media/cdc8cc255a549d49dc.png)

![Иллюстрация к теме «Обобщенные числовые алгоритмы»](assets/media/cf11972f1cc5481405.png)
`std::accumulate` (из заголовка `<numeric>`) — это алгоритм C++, который вычисляет сумму или накапливает другой результат, последовательно применяя операцию (по умолчанию сложение) к элементам диапазона, начиная с заданного начального значения.
1 + 2 + 3 + 4 и т.д.

![Иллюстрация к теме «Обобщенные числовые алгоритмы»](assets/media/849f711177550d39bf.png)

@@ cpp-containers
# Контейнеры, аллокаторы и адаптеры
> Теория, примеры и иллюстрации по теме.

## STL. Итераторы и основные алгоритмы - II

![Иллюстрация к теме «STL. Итераторы и основные алгоритмы - II»](assets/media/e9fc583271199f6256.png)

Named Requirements - это минимальные требования чтобы контейнер можно было назвать им

![Иллюстрация к теме «STL. Итераторы и основные алгоритмы - II»](assets/media/696ad5555703d6e3e4.png)

## Последовательные массивы

![Иллюстрация к теме «Последовательные массивы»](assets/media/e3654aea788ea69a46.png)

![Иллюстрация к теме «Последовательные массивы»](assets/media/e285506b27a15c137a.png)
![Иллюстрация к теме «Последовательные массивы»](assets/media/a0fb0baa1d7f213381.png)
Требования чтобы удовлетворять STL контейнеру

![Иллюстрация к теме «Последовательные массивы»](assets/media/38d321d6a49baccf21.png)

## На деревьях

![Иллюстрация к теме «На деревьях»](assets/media/353fe37d9ead1a639f.png)

## На хеш-таблицах

![Иллюстрация к теме «На хеш-таблицах»](assets/media/0a57a3850624558760.png)

## Поломка итератора

![Иллюстрация к теме «Поломка итератора»](assets/media/843d4235c02797c0dd.png)

## Allocator

![Иллюстрация к теме «Allocator»](assets/media/6450b59b5260c32547.png)

![Иллюстрация к теме «Allocator»](assets/media/4fa1a332f8b80f46ed.png)

Аллокатор — это объект, который **выделяет и освобождает память для объектов**.
Например, контейнеры STL используют его внутри:
- `std::vector`
- `std::list`
- `std::map`

Он делает две основные вещи:
- **allocate()** — выделяет память
- **deallocate()** — освобождает память

```cpp
int main() {
    std::allocator<int> alloc;
    int* ptr = alloc.allocate(5);

    alloc.construct(&ptr[0], 10);
    alloc.construct(&ptr[1], 20);

    std::cout << ptr[0];
    alloc.deallocate(ptr, 5);
}
```
## Адаптеры контейнеров

![Иллюстрация к теме «Адаптеры контейнеров»](assets/media/7b0ff8a1e88aa4883f.png)

## Адаптеры итераторов

![Иллюстрация к теме «Адаптеры итераторов»](assets/media/c36478d1ce9aaa6811.png)

## Потоковые итераторы

![Иллюстрация к теме «Потоковые итераторы»](assets/media/ab3bef65b8c3621d14.png)

![Иллюстрация к теме «Потоковые итераторы»](assets/media/f2a2f5c57fa5166fea.png)

## Tag Dispatch Idiom

![Иллюстрация к теме «Tag Dispatch Idiom»](assets/media/392ea617280c6fc79d.png)

## iterator_traits - признаки оператора

`std::iterator_traits` в C++ — это шаблонный класс-«traits» (свойство), используемый для получения информации об итераторах (тип значения, категория итератора и т.д.) внутри обобщенных алгоритмов.


## Iterator Operation

![Иллюстрация к теме «Iterator Operation»](assets/media/7a6f7d7314bcda4d82.png)

advence -  сдвинуть итератор на n ячеек вперед
distance - разность итераторов
next - след
prev - пред

@@ cpp-errors
# Обработка ошибок и исключения
> Коды возврата, optional, expected и гарантии безопасности.

## Error Handling

![Иллюстрация к теме «Error Handling»](assets/media/dc2520328dc2cf1c31.png)

![Иллюстрация к теме «Error Handling»](assets/media/825aa5442f1e46dade.png)

static_assert -  ошибка на этапе компиляции
`static_assert(sizeof(int)  4, "int must be 4 bytes");`

## Метод кодов возврата

старый подход иногда имеет смысл

![Иллюстрация к теме «Метод кодов возврата»](assets/media/fbb2c69045a7043652.png)

## Метод Exception. throw + try + catch

![Иллюстрация к теме «Метод Exception. throw + try + catch»](assets/media/c14fec684aabb6890d.png)

... ловит любую ошибку

```cpp
int main() {
    int a, b;

    std::cin >> a >> b;

    try {
        if (std::cin.fail()) {
            throw std::runtime_error("Input is not a number");
        }

        if (b == 0) {
            throw std::runtime_error("Division by zero");
        }

        std::cout << "Result: " << a / b << std::endl;
    }
    catch (const std::runtime_error& e) {
        std::cout << "Error: " << e.what() << std::endl;
    }

    return 0;
}
```

если разные типы ошибок нужно писать два catch

на практике пишут сначала все известные ошибки а потом  catch(...){}

## как работает исключение в работе программы

исключение живет все время пока его кто-то не поймает

при исключении работа программы останавливается и в стек вызова функции пробрасывается вверх наше исключение => ![Иллюстрация к теме «как работает исключение в работе программы»](assets/media/e40c6f548e30ed4a34.png)

- создаётся объект исключения
- начинается **поиск обработчика**
- программа начинает **разматывать стек (stack unwinding)**

![Иллюстрация к теме «как работает исключение в работе программы»](assets/media/fefa86952d4f6bd4f3.png)
![Иллюстрация к теме «как работает исключение в работе программы»](assets/media/2017fb52e29d4785cf.png)
![Иллюстрация к теме «как работает исключение в работе программы»](assets/media/a95a8bde7cd3e4ae98.png)



## noexcept
это ключевое слово для компилятора, оно сообщает, что функция не бросает исключений
noexcept{false} - значит бросает

![Иллюстрация к теме «noexcept»](assets/media/b3bf4ab52a4bdc413f.png)

два исключения подряд приводят к std::terminate   **так нельзя**

деструктор никогда не бросает исключение

конструктор вполне может ,например, если память не выделилась

## Гарантии безопасности исключений

![Иллюстрация к теме «Гарантии безопасности исключений»](assets/media/a9cee930869930d456.png)

## std::exception

![Иллюстрация к теме «std::exception»](assets/media/3400f76b55a4ab01be.png)

![Иллюстрация к теме «std::exception»](assets/media/6a0cd461ddb9eeae51.png)

![Иллюстрация к теме «std::exception»](assets/media/cf27f724db99856e4f.png)

## std::expected

![Иллюстрация к теме «std::expected»](assets/media/f83391612643827982.png)

![Иллюстрация к теме «std::expected»](assets/media/9a1792d7f826be4a27.png)

![Иллюстрация к теме «std::expected»](assets/media/030e67ae3f9d4d8bea.png)

## std::optional

`std::optional` — это контейнер, который говорит: **"Здесь может быть значение, а может и не быть."**

```cpp
int main() {
    std::optional<int> opt = std::nullopt;
    opt = 10;
    if (opt.has_value()) {
        std::cout << opt.value() << '\n';
    }
    else {
        std::cout << "No value" << '\n';
    }
}
```

1. Проблема, которую решает `optional`

Раньше часто делали так:

```cpp
int find_user_id();
```
Но что возвращать, если пользователь **не найден**?
Обычно делали костыли:

❌ Способ 1 — специальное значение
```cpp
int find_user_id() {
    return -1;
}
```
Проблема:
- `-1` может быть **валидным значением**

❌ Способ 2 — указатель
```cpp
int* find_user_id();
```
Если нет результата:
```cpp
return nullptr;
```

Проблема:
- неудобно
- можно случайно разименовать `nullptr`

2. Решение — `std::optional`

```cpp
#include <optional>

std::optional<int> find_user_id();
```
Теперь функция говорит:
либо есть `int`, либо **ничего**

@@ cpp-callables
# Приведения типов и CRTP
> Функциональные объекты, захват данных и полиморфизм на этапе компиляции.

## Cast, CRTP

![Иллюстрация к теме «Cast, CRTP»](assets/media/f5b8ad1b51f2f0e631.png)

![Иллюстрация к теме «Cast, CRTP»](assets/media/1781fa0dcaf4fbd2df.png)

```cpp
int main() {
int a = 10;
const int* b = &a;

int* c = const_cast<int*>(b);
*c = 50;

std::cout << a;
}
```

![Иллюстрация к теме «Cast, CRTP»](assets/media/dfa6245642541c15ee.png)


![Иллюстрация к теме «Cast, CRTP»](assets/media/b437ab159e5e4d0a12.png)
`dynamic_cast` делает **проверку типа во время выполнения (runtime)** для полиморфных классов и безопасно приводит указатель/ссылку к нужному типу.

Когда нужен `dynamic_cast`

Когда у тебя есть **базовый указатель**, но нужно понять **какой конкретный наследник внутри**.

![Иллюстрация к теме «Cast, CRTP»](assets/media/14e1fb3a62ee505c7d.png)

![Иллюстрация к теме «Cast, CRTP»](assets/media/3ecada4211907fe0dd.png)

## CRTP

CRTP (Curiously Recurring Template Pattern) — это идиома шаблонов в C++, при которой **класс передаёт сам себя как параметр шаблона своему базовому классу**.

То есть базовый класс становится шаблоном, а производный класс передаёт себя в этот шаблон.

```cpp
template <typename Derived>
class Base {
public:
    void interface() {
        static_cast<Derived*>(this)->implementation();
    }
};

class Derived : public Base<Derived> {
public:
    void implementation() {
        std::cout << "Derived implementation\n";
    }
};
```

@@ cpp-lambdas
# Функторы и лямбда-выражения
> Теория, примеры и иллюстрации по теме.

## lambda

## functor

![Иллюстрация к теме «functor»](assets/media/0c104c638a1b609e3b.png)

функтор

указатель на функцию int (*func)(int, int)

![Иллюстрация к теме «functor»](assets/media/12fe7b5e72ad5d7e6c.png)

![Иллюстрация к теме «functor»](assets/media/7372b01c2589307d66.png)

## Lambda (C++11)

![Иллюстрация к теме «Lambda (C++11)»](assets/media/217945be3bdb1b83f7.png)

```cpp
int main() {
    auto printer = [](const std::string& str) {
        std::cout << str << '\n';
    };
    printer("hello");
}
```

как функтор лямбду можно передавать

```cpp
std::vector<int> tmp = {1, 2, 5, 0};
std::sort(tmp.begin(), tmp.end(), [](int a, int b) {return b < a;});
```

можно использовать другие переменные из скоупа

```cpp
int i = 1;
int j = 2;
auto cmp = [&i, &j](int a, int b) {return b < a + i + j;};
```

какие лямбды могут быть

![Иллюстрация к теме «Lambda (C++11)»](assets/media/cf6ae3f78fd304ff42.png)

ps: Mutable - ключевое слово, позволяющее изменять члены данных в const-объектах.

![Иллюстрация к теме «Lambda (C++11)»](assets/media/0869f5a100f566adb3.png)

[std::invoke](https://www.google.com/search?q=std%3A%3Ainvoke&sca_esv=945a4ea532ea43f8&sxsrf=ANbL-n6yFoFtiXm0_gPQGuXi5ldCekLPrg%3A1773871944123&ei=SCO7aYGZB8_-wPAP3oSF0A0&biw=1536&bih=695&ved=2ahUKEwj4urr7u6qTAxU1ExAIHb-jASoQgK4QegQIARAB&uact=5&oq=std%3A%3Ainvoke+%D1%8D%D1%82%D0%BE&gs_lp=Egxnd3Mtd2l6LXNlcnAiEnN0ZDo6aW52b2tlINGN0YLQvkjyD1C_A1jeDXABeACQAQCYAZkBoAHABKoBAzAuNLgBA8gBAPgBAZgCAKACAJgDAIgGAZIHAKAHtAGyBwC4BwDCBwDIBwCACAA&sclient=gws-wiz-serp) — это шаблонная функция из библиотеки `<functional>` (начиная с C++17), предназначенная для унифицированного вызова любых «вызываемых объектов» (функций, лямбд, указателей на методы или члены класса) с заданными аргументами. Она устраняет различия в синтаксисе вызова, позволяя писать универсальный код.

@@ cpp-move
# Категории значений и семантика перемещения
> lvalue, prvalue, xvalue, std::move и forwarding.

## Value categories & Move Semantics

## Value categories

![Иллюстрация к теме «Value categories»](assets/media/bf078c3ccf8c35e2f7.png)

**Lvalue** (left value, «локаторное значение») — это выражение в языках C/C++, которое ссылается на конкретную область памяти (имеет адрес) и сохраняется после завершения текущей инструкции (имеет имя). Lvalue часто находится слева от знака присваивания (`=`), что позволяет изменять хранящееся в нем значение.

**Rvalue (right value)** в C++ — это выражение, представляющее собой временное, неименованное значение, которое обычно располагается справа от оператора присваивания. В отличие от lvalue, rvalue не имеет постоянного адреса в памяти, к которому можно обратиться, и часто уничтожается сразу после использования (например, литералы `42`, временные объекты или результаты операций `a + b`).

![Иллюстрация к теме «Value categories»](assets/media/b78e0b8a1bfacd483d.png)

![Иллюстрация к теме «Value categories»](assets/media/ba55ea492ccbc3f54b.png)

![Иллюстрация к теме «Value categories»](assets/media/a211d0bd9fff9fd520.png)

expression - выражения *  -  /

![Иллюстрация к теме «Value categories»](assets/media/f04011e7994ad079ba.png)
![Иллюстрация к теме «Value categories»](assets/media/6b5c70d2b3f6ebc55c.png)
![Иллюстрация к теме «Value categories»](assets/media/3d31b24dd798bc9648.png)

![Иллюстрация к теме «Value categories»](assets/media/1b48898af764f8d934.png)
![Иллюстрация к теме «Value categories»](assets/media/182b2b329cf29ce5a8.png)
это объект у которого есть место в пяти но нет в нем какой-то переменной
## Rvalue reference

![Иллюстрация к теме «Rvalue reference»](assets/media/bfeae17537ab4670f4.png)

```cpp
// Simple move constructor
A(A&& arg) : member(std::move(arg.member)) // the expression "arg.member" is lvalue
{}

// Simple move assignment operator
A& operator=(A&& other)
{
    member = std::move(other.member);
    return *this;
}
```
`std::move` приводит выражение к ссылке на rvalue. Перенос ресурсов выполняет выбранный перемещающий конструктор или оператор присваивания.

**Reference Collapsing** (свертывание ссылок) в C++ — это правило, введенное в C++11, которое определяет, как компилятор обрабатывает ссылки на ссылки, возникающие в результате подстановки типов в шаблонах или использовании `typedef`/`using`.
В C++ напрямую объявлять ссылку на ссылку (например, `int & & r;`) запрещено, но такие конструкции могут появляться косвенно.

Возвращать rvalue-ссылку допустимо только при достаточном времени жизни объекта. Возвращение ссылки на локальный объект создаёт висячую ссылку.
## Move constructor & move assignment

std::exchenge
```cpp
int main() {
    int x = 10;
    std::exchange(x, 20);
    std::cout << x;
}
```

![Иллюстрация к теме «Move constructor & move assignment»](assets/media/2510549788287b6b32.png)

### Copy-And-Swap Idiom

В идиоме copy-and-swap оператор присваивания обменивает состояние с подготовленной копией. Для реализации обмена часто используют перемещение.

![Иллюстрация к теме «Move constructor & move assignment»](assets/media/00467406b990d15f9f.png)
![Иллюстрация к теме «Move constructor & move assignment»](assets/media/4d58410d41e15474bc.png)

### Reference collapsing

![Иллюстрация к теме «Move constructor & move assignment»](assets/media/6327bf68922c21d597.png)

`std::forward` — это инструмент для **идеальной передачи** (perfect forwarding) аргументов в шаблонах. Она позволяет передать аргумент в другую функцию, сохранив его «природу»: был ли он временным объектом (rvalue) или именованной переменной (lvalue)

![Иллюстрация к теме «Move constructor & move assignment»](assets/media/620dc82d1d3d8ad6cc.png)

```cpp
template <typename T>
void wrapper(T&& arg) {
    // std::forward "решает", вызвать move или передать как обычную ссылку
    target_function(std::forward<T>(arg));
}
```

![Иллюстрация к теме «Move constructor & move assignment»](assets/media/e441ee155a8f5eb11b.png)

![Иллюстрация к теме «Move constructor & move assignment»](assets/media/6a9186dccd4e9b56f8.png)

![Иллюстрация к теме «Move constructor & move assignment»](assets/media/256d2e67bd6a1566b5.png)

Многоточие `...` обозначает пакет параметров или его раскрытие в зависимости от позиции.

@@ cpp-variadic
# Вариативные шаблоны, variant и visit
> Теория, примеры и иллюстрации по теме.

## Variadic template

Пакет шаблонных параметров позволяет принимать переменное число типов или значений.

![Иллюстрация к теме «Variadic template»](assets/media/0da4ec2bdf7a188ffc.png)

В рекурсивном варианте отдельно обрабатывается первый аргумент, а оставшийся пакет передаётся следующему вызову.

sizeof...
```cpp
template<typename... Args>
void printCount(Args... args) {
    // Возвращает количество аргументов, переданных в функцию
    std::cout << sizeof...(args) << std::endl;
}
```

![Иллюстрация к теме «Variadic template»](assets/media/5816abc7c0c0b8df88.png)
параметр пак - несколько аргументов
sizeof... -  работает на этапе компиляции
Выражение свёртки (fold expression) применяет бинарный оператор к элементам пакета параметров.

![Иллюстрация к теме «Variadic template»](assets/media/e302054ca93b499e23.png)

![Иллюстрация к теме «Variadic template»](assets/media/8f1bf93af08978914a.png)
Fold expression
Есть левый fold есть правый fold
Бинарный и унарный

[Comma fold pattern (свёртка с запятой)](https://www.google.com/search?q=Comma+fold+pattern+%28%D1%81%D0%B2%D1%91%D1%80%D1%82%D0%BA%D0%B0+%D1%81+%D0%B7%D0%B0%D0%BF%D1%8F%D1%82%D0%BE%D0%B9%29&oq=Comma+fold+pattern+%D0%B2+%D1%81%2B%2B&gs_lcrp=EgZjaHJvbWUyBggAEEUYOdIBCTM2ODlqMGoxNagCCLACAQ&sourceid=chrome&ie=UTF-8&mstk=AUtExfB1gmvbMefh-VFTHkGNcuR4hVRDQ7Nxcyg0_a0VQPzQIifsk6EvHfb7u6KRaUHk976Nn3S7QUdM-DtNycI7fFKvu_auWSD3Wx0GDthzsNpgWwtW_X54X9Moq4Konlw0vu7dNiNeRUt4N_-FTaQkHT5eCr_1TZ72o_70unjqWqqgkug&csui=3&ved=2ahUKEwi90ueS6ISUAxUEhf0HHdHDPdgQgK4QegQIARAB) — это синтаксис C++17, использующий Fold Expressions (свёртку пакетов параметров). Он позволяет применять действие к каждому элементу variadic-шаблона, используя оператор запятая (`,`) для последовательного выполнения операций. Формат `(..., действие(аргументы))` выполняет все действия по порядку

Правила ввода типов -> компилятор сам умеет выводить типы

## std::variant

![Иллюстрация к теме «std::variant»](assets/media/d4c82ccfe25c5f2b8d.png)

**[std::variant](https://www.google.com/search?q=std%3A%3Avariant&sca_esv=1cd8785de84224e8&biw=1536&bih=695&sxsrf=ANbL-n7GA_vv6jBpLz0wlzz1S2EX5QdFhw%3A1776976256580&ei=gIHqaeaKI_iP9u8P8sbOuAk&ved=2ahUKEwihteu36ISUAxX3_7sIHfPOLUkQgK4QegQIARAB&uact=5&oq=std%3A%3Avariant+%D1%81%2B%2B+%D1%87%D1%82%D0%BE+%D1%8D%D1%82%D0%BE+&gs_lp=Egxnd3Mtd2l6LXNlcnAiIHN0ZDo6dmFyaWFudCDRgSsrINGH0YLQviDRjdGC0L4gSIkjUF9YmyFwAXgBkAEBmAGVBKAB5QqqAQkwLjQuMS41LTG4AQPIAQD4AQGYAgGgAgzCAgoQABiwAxjWBBhHmAMAiAYBkAYIkgcBMaAHjgKyBwC4BwDCBwMzLTHIBwqACAA&sclient=gws-wiz-serp&mstk=AUtExfCY_CUzprJasBmz48vZtfdd2CeY1ljz2F6cP-rAVvBVfjSU_zmvJ3z9wzNzkQ1VCWv4pD96v_RjbxKJdTt0MyuUdRTMd5FaWOByyQG_HFALMpbmXg_6Z82RZXxWpwA3rp8N0qwlnXDMGe_2lUb1VX0QLuP0Ls83_vWb13lwR9UWXZbAuq8O9M5OAE15crZ9fpgI&csui=3)** — это типобезопасный аналог объединения (`union`) из C, представленный в **C++17**. Он хранит в одной переменной значение одного типа из заданного набора. Variant знает, какой тип данных в нем хранится, обеспечивая безопасный доступ и предотвращая ошибки, связанные с неправильной интерпретацией данных, типичные для `union`.

`std::variant` — это переменная “один из этих типов”.

Строго типизированный юнион

## `std::visit`
— это способ безопасно обработать значение, которое лежит внутри std::variant

То есть `visit` как будто говорит:   **“посмотри, какой тип сейчас внутри variant, и передай его в эту функцию”**

![Иллюстрация к теме «std::visit»](assets/media/8c0c00fd27b5a814d6.png)
Пример CRTP Это enebled_shared from this

@@ cpp-meta
# Метапрограммирование и концепты
> Пакеты параметров, проверка требований к типам и типобезопасные альтернативы.

## Template Metaprogramming

## constexpr

![Иллюстрация к теме «constexpr»](assets/media/023ebb74f1e23b32d6.png)

![Иллюстрация к теме «constexpr»](assets/media/2974fdaaf06e5c7add.png)

## Template Specialization

![Иллюстрация к теме «Template Specialization»](assets/media/4c8d93304913575198.png)

## Metaprogramming С++

**Метапрограммирование в C++** — это написание программного кода, который выполняется во время компиляции, а не во время работы программы (runtime).

![Иллюстрация к теме «Metaprogramming С++»](assets/media/4f13fa696d35273e03.png)

> пример: тот же факториал

## type_traits

![Иллюстрация к теме «type_traits»](assets/media/02609693ab3441c2c7.png)

```cpp
int main(int argc, char** argv) {
    int b = 10;
    int* a = &b;
    assert(std::is_pointer<decltype(b)>::value);
}
```

## SFINAE

**SFINAE** (Substitution Failure Is Not An Error) — это правило компиляции в C++, которое означает: **«Неудачная подстановка типа в шаблон не является ошибкой компиляции»**.

![Иллюстрация к теме «SFINAE»](assets/media/cd9cd6f34fc3b72e73.png)

![Иллюстрация к теме «SFINAE»](assets/media/de9f1aa62b1a1c6109.png)

## Concepts (C++ 20)

Концепты позволяют задавать ограничения шаблонов явно. Для многих проверок типов они заменяют громоздкие приёмы на основе SFINAE.
В выражении `requires` можно проверить наличие вложенного типа, допустимость операции или соответствие другому концепту.

Concept нативный

![Иллюстрация к теме «Concepts (C++ 20)»](assets/media/e8b967c18ac0fed041.png)

**Концепт** — это именованное правило (ограничение), которое описывает, каким требованиям должен соответствовать тип данных, чтобы его можно было использовать в шаблоне.

**Requires-выражение** — это блок кода, внутри которого вы перечисляете конкретные операции, которые должны успешно компилироваться для данного типа.

Если концепт — это название правила, то `requires` — это список проверок внутри этого правила.

![Иллюстрация к теме «Concepts (C++ 20)»](assets/media/f98f782e5f4b3acec9.png)

### Simple requirement - это когда один requires

**Simple requirements** (простые требования) в C++ — это вид требований внутри выражения `requires` (появились в **C++20**), которые проверяют саму **возможность компиляции** указанного выражения для заданных типов.

![Иллюстрация к теме «Concepts (C++ 20)»](assets/media/533b3b082ec067daf3.png)

### Nested - это когда в концепте есть ещё один requires

**Nested requirements** (вложенные требования) — это еще один вид требований внутри блока `requires` в C++20. В отличие от простых требований, которые просто проверяют «компилируется ли код», вложенные требования позволяют проверять **логические условия** (предикаты).

![Иллюстрация к теме «Concepts (C++ 20)»](assets/media/ae1108a84163cad785.png)

### Составные требования

**Compound requirements** (составные требования) — это самая мощная форма проверок внутри блока `requires`. Они позволяют проверить не только то, что выражение **компилируется**, но и наложить условия на **результат** этого выражения (например, какой тип оно возвращает и может ли оно бросать исключения).

![Иллюстрация к теме «Concepts (C++ 20)»](assets/media/0803531515e3867304.png)

###  Type requerements

![Иллюстрация к теме «Concepts (C++ 20)»](assets/media/4b69a3f55a53786467.png)

![Иллюстрация к теме «Concepts (C++ 20)»](assets/media/a2bc29b446e5963c0b.png)

@@ cpp-threads
# Асинхронность и многопоточность
> Конкурентность, параллелизм, mutex, atomic и передача результата.

## Асинхронное программирование

**Закон Мура** — это правило, согласно которому количество транзисторов на компьютерном чипе увеличивается в два яаза примерно каждые два года

![Иллюстрация к теме «Асинхронное программирование»](assets/media/769c5552f3d9be4484.png)

## Concurrency vs Parallelism

программа может быть параллельная и асинхронная

Concurrency — конкурентное выполнение, при котором несколько задач продвигаются в течение общего интервала времени.
Parallelism — параллельное выполнение нескольких действий в один момент времени.

![Иллюстрация к теме «Concurrency vs Parallelism»](assets/media/18b77184d20d98d4d1.png)

![Иллюстрация к теме «Concurrency vs Parallelism»](assets/media/e19ccc9ad388716002.png)

Асинхронная операция позволяет продолжить работу до получения результата.
Параллельность описывает одновременное выполнение, асинхронность — способ ожидания и получения результата.

`thread.join()` ожидает завершения потока.

**Горутины** (goroutines) это в языке Go — это легковесные потоки, управляемые планировщиком Go (встроено в язык), а не ОС. Они стартуют с 2 КБ стека, позволяя запускать сотни тысяч задач.

**Корутины** (coroutines) в других языках — это общее понятие сопрограмм (функций, способных приостанавливать выполнение и возвращать управление), которые могут быть как с поддержкой стека (stackful), так и без (stackless).

Join присоединяет
Detach - отсоединяет поток

`sleep_for` приостанавливает поток как минимум на заданный интервал. Фактическое время может быть больше из-за планирования.

По закону Амдала последовательная часть работы ограничивает ускорение при распараллеливании.

![Иллюстрация к теме «Concurrency vs Parallelism»](assets/media/8d427db24fac27fc1f.png)

## Проблемы при многопоточке

Состояние гонки возникает, когда результат зависит от порядка выполнения событий. Гонка данных в C++ возникает при несинхронизированных конфликтующих обращениях к одной области памяти, если хотя бы одно из них записывает данные.

Коммутативность операций не устраняет гонку данных. Обновление разделяемого счётчика требует атомарной операции или синхронизации.

![Иллюстрация к теме «Проблемы при многопоточке»](assets/media/7073069cde9885de61.png)

![Иллюстрация к теме «Проблемы при многопоточке»](assets/media/5b0548c5b2724bc49f.png)

![Иллюстрация к теме «Проблемы при многопоточке»](assets/media/92c01b8be53dd1c17e.png)

1. mutex- позволяет запретить одновременное обращение из разных потоков
2. try_lock -> true false если получилось залочить
3. lock unlock
4. lock_guard - авто лок анлок
5. std::atomic - примитив синхронизации с переменными. Хорошо подходит для обычных операций. Атомарное действие- неделимое действие в информатике, которое выполняется либо полностью, либо не выполняется вовсе, гарантируя отсутствие промежуточных состояний
Для отдельных атомарных операций блокировка может не требоваться. Для составного инварианта может понадобиться мьютекс.
Для одной атомарной операции отдельная блокировка может не требоваться.
fetch_add
### Ошибки многопоточного программирования

![Иллюстрация к теме «Проблемы при многопоточке»](assets/media/4ecdecc3dd5a105033.png)

DeadLock - ситуация когда несколько процессов ожидают ресурсы занятные самими этими процессами (цикл в графе ожидания команд)
Например 1 взял 1гантелю другой вторую и обоим нужна 2 и они ждут

LiveLock - ситуация в которой система система не застревает (как в обычной блокировке) а занимается бесполезной работой, чтобы не простаивать

condition_variable - переводит поток в состояние ожидания и проверяем доступно или недоступно можно notify уведомить

Std::promise - это объект в котором храним какой-то объект обещания в котором потом будет результат

`std::future` получает результат или исключение из общего состояния, связанного со `std::promise`.
