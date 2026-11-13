@@ cpp-ownership
# Умные указатели
> Единственный владелец, совместное владение и наблюдение за объектом.

## Модели владения

- `std::unique_ptr<T>` обозначает единственного владельца. Его можно переместить, копирование запрещено. Создавайте объект через `std::make_unique<T>(...)`.
- `std::shared_ptr<T>` разделяет владение через управляющий блок. Объект уничтожается, когда исчезает последний сильный владелец. Потокобезопасность счётчика сама по себе не защищает поля объекта.
- `std::weak_ptr<T>` наблюдает за объектом с совместным владением. `lock()` возвращает сильную ссылку, если объект ещё жив, либо пустой `shared_ptr`.

```cpp run
#include <cassert>
#include <memory>

int main() {
    auto owner = std::make_shared<int>(42);
    std::weak_ptr<int> observer = owner;
    {
        auto guard = observer.lock();
        assert(guard && *guard == 42);
    }
    owner.reset();
    assert(observer.expired());
}
```

## Циклы и доступ к себе

Если два объекта удерживают друг друга через `shared_ptr`, их счётчики могут остаться положительными после исчезновения внешних владельцев. Для обратной связи вроде «ребёнок → родитель» подходит `weak_ptr`, если родителем владеют в другом месте.

Наследование от `std::enable_shared_from_this<T>` даёт `shared_from_this()` после подключения объекта к существующему управляющему блоку. Конструкция `std::shared_ptr<T>(this)` может создать второй независимый блок для того же объекта.

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

## Как читать диапазон

`[first, last)` включает начало и исключает конец. `end()` — позиция за последним элементом. Категория итератора определяет разрешённые операции. Итератор списка двунаправленный, итератор вектора поддерживает произвольный доступ и непрерывен, а потоковый итератор может быть однопроходным. `std::iterator_traits` предоставляет свойства итератора, `std::advance` выбирает подходящую механику перемещения.

| Задача | Инструменты |
| --- | --- |
| Найти или посчитать | `find`, `find_if`, `count_if`, `search` |
| Сравнить диапазоны | `equal`, `mismatch` |
| Заполнить или преобразовать | `fill`, `generate`, `copy`, `transform` |
| Переставить элементы | `partition`, `rotate`, `shuffle`, `sort` |
| Работать с отсортированными множествами | `set_union`, `set_intersection`, `set_difference` |
| Выполнить вычисление | `accumulate`, `iota`, `inner_product` |

```cpp run
#include <algorithm>
#include <cassert>
#include <vector>

int main() {
    std::vector<int> values{4, 2, 4, 1, 2};
    std::sort(values.begin(), values.end());
    values.erase(std::unique(values.begin(), values.end()), values.end());
    assert((values == std::vector<int>{1, 2, 4}));
}
```

`unique` сдвигает соседние повторы в логический хвост и возвращает новую границу. `erase` удаляет хвост из вектора. Для вставки при копировании удобен `std::back_inserter`. Вместо удалённого в C++17 `random_shuffle` используйте `std::shuffle` с генератором.

## Контейнеры и инвалидирование

`vector` удобен для индексов и обхода, `deque` — для добавлений с обоих концов, `list` — для операций с уже найденным узлом. `map` и `set` хранят ключи в порядке сравнения и дают логарифмический поиск. `unordered_map` обычно даёт среднее O(1) при хорошем распределении хешей, худший поиск — O(n).

Правила инвалидирования зависят от контейнера и операции. Перевыделение `vector` инвалидирует все итераторы, вставка в `map` сохраняет их, rehash у `unordered_map` инвалидирует итераторы. `stack`, `queue` и `priority_queue` — адаптеры контейнеров. Аллокатор определяет интерфейс выделения памяти, а tag dispatch позволяет выбрать реализацию по категории итератора.

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

```cpp
int predicat() {
    return rand();
}

int main() {
    std::vector<int> a(10);
    std::generate(a.begin(), a.end(), predicat);
    for (int& i : a) {
        std::cout << i << ' ';
    }
}
```

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

## Выбор представления

`std::optional<T>` выражает значение, которое может отсутствовать. `std::expected<T, E>` (C++23) хранит успешный результат или данные об ошибке. Коды возврата удобны на границах с C API. Исключения передают ошибку вверх по стеку до подходящего обработчика.

```cpp run
#include <cassert>
#include <optional>
#include <vector>

std::optional<int> First(const std::vector<int>& values) {
    if (values.empty()) {
        return std::nullopt;
    }
    return values.front();
}

int main() {
    assert(!First({}));
    assert(First({7, 8}).value_or(-1) == 7);
}
```

## Как работает исключение

`throw` начинает распространение исключения. При раскрутке стека уничтожаются построенные локальные объекты. Типичные исключения стандартной библиотеки ловят через `const std::exception&`. Если исключение покидает функцию с `noexcept`, вызывается `std::terminate`.

- **Базовая гарантия.** Инварианты сохранены, утечек ресурсов нет.
- **Сильная гарантия.** Если операция завершилась исключением, наблюдаемое состояние сохраняется.
- **Гарантия отсутствия исключений.** Операция не выпускает исключений наружу.

## Самопроверка

Какой тип вернуть из поиска по таблице, если ключ может отсутствовать? Что изменится, если вызывающему коду нужна причина отказа?

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

## Четыре явных приведения

- `static_cast` выражает проверяемое по типам преобразование, например из `int` в `double`.
- `dynamic_cast` позволяет проверить тип полиморфного объекта при нисходящем приведении. Неудача для указателя даёт `nullptr`, для ссылки — `std::bad_cast`.
- `const_cast` меняет квалификаторы. Запись в объект, изначально созданный как `const`, остаётся неопределённым поведением.
- `reinterpret_cast` выражает низкоуровневое преобразование. После него остаются требования к выравниванию и допустимому доступу к объекту.

## Вызываемые объекты

Функтор определяет `operator()`. Лямбда создаёт объект замыкания. `[limit]` копирует значение, `[&limit]` даёт доступ к исходной переменной по ссылке. Ссылочный захват требует, чтобы переменная жила дольше всех вызовов. `std::invoke` унифицирует вызов функций, функторов и указателей на члены.

```cpp run
#include <algorithm>
#include <cassert>
#include <vector>

int main() {
    const std::vector<int> values{1, 4, 7};
    int limit = 4;
    auto it = std::find_if(values.begin(), values.end(),
                           [limit](int value) { return value > limit; });
    assert(it != values.end() && *it == 7);
}
```

## CRTP

В CRTP производный тип передаётся шаблонному базовому классу, например `struct Meter : Printable<Meter>`. Базовый класс может вызвать операцию производного через `static_cast<Derived&>(*this)` при корректном инварианте наследования. Тип известен при компиляции, поэтому виртуальная диспетчеризация для такого вызова не требуется.

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

## Категории выражений

`lvalue` обозначает объект с идентичностью, например именованную переменную. `prvalue` вычисляет значение, например `42` или `std::string{"hi"}`. `xvalue` обозначает объект, ресурсы которого можно повторно использовать, например `std::move(value)`. `glvalue` объединяет lvalue и xvalue, `rvalue` — prvalue и xvalue.

```cpp run
#include <cassert>
#include <string>
#include <utility>

int main() {
    std::string source = "notes";
    std::string destination = std::move(source);
    assert(destination == "notes");
    source = "new value";
}
```

## Что делает std::move

`std::move` приводит выражение к rvalue-ссылке. Решение о передаче ресурса принимает выбранный конструктор или оператор присваивания. Именованный параметр типа `T&&` внутри функции сам является lvalue. Стандартный объект после перемещения обычно находится в допустимом, но не уточнённом состоянии.

Перемещающий конструктор часто помечают `noexcept`, если он действительно не бросает исключений. Это позволяет некоторым контейнерам перемещать элементы при росте. В идиоме copy-and-swap присваивание сначала подготавливает новый объект, затем обменивает состояния.

## Forwarding

В контексте вывода типа параметр `T&&` может быть forwarding reference. `std::forward<T>(arg)` сохраняет исходную категорию аргумента. При свёртке ссылок сочетания с `&` дают `&`, а `&&` с `&&` дают `&&`.

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

## Пакеты и свёртки

`typename... Args` объявляет пакет типов, `args...` раскрывает пакет. Fold expression сворачивает пакет по оператору. `(0 + ... + args)` даёт ноль для пустого пакета. `std::variant<A, B>` хранит одну из альтернатив, а `std::visit` вызывает подходящую ветку для текущего значения.

```cpp run
#include <concepts>

template <std::integral... Args>
constexpr auto Sum(Args... args) {
    return (0 + ... + args);
}

int main() {
    static_assert(Sum(2, 3, 5) == 10);
    static_assert(Sum() == 0);
}
```

## Метапрограммирование

`constexpr` разрешает вычисление в константном контексте при подходящих аргументах. Специализация меняет реализацию шаблона для выбранных аргументов. `<type_traits>` содержит предикаты и преобразования типов, например `std::is_integral_v<T>` и `std::remove_cvref_t<T>`. При SFINAE некоторые ошибки подстановки исключают шаблон из кандидатов перегрузки.

## Как читать requires

Concept (C++20) даёт имя ограничению. В `requires` простое требование проверяет корректность выражения, требование к типу — наличие типа, вложенное — истинность ограничения. Составное требование проверяет выражение, его тип и при необходимости `noexcept`.

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

## Несколько задач одновременно

Конкурентность позволяет нескольким задачам продвигаться во времени, в том числе по очереди на одном ядре. Параллелизм означает одновременное выполнение. Асинхронный интерфейс позволяет продолжить работу до получения результата. `std::thread::join()` ждёт завершения потока, а `std::jthread` (C++20) присоединяет поток при уничтожении. `detach()` требует отдельного контроля времени жизни данных.

```cpp run
#include <atomic>
#include <cassert>
#include <thread>

int main() {
    std::atomic<int> total{0};
    std::thread worker([&total] { total.fetch_add(1); });
    total.fetch_add(1);
    worker.join();
    assert(total.load() == 2);
}
```

## Общие данные

Data race возникает при конфликтующих обращениях из разных потоков без необходимой синхронизации, если хотя бы одно обращение — запись и операции не атомарны. В C++ это неопределённое поведение. Даже коммутативное сложение требует синхронизации, когда несколько потоков пишут в обычную переменную.

- `std::mutex` защищает критическую секцию, `std::lock_guard` освобождает блокировку по RAII.
- `std::atomic` подходит для отдельных атомарных операций. Инвариант из нескольких связанных полей может требовать общего mutex.
- `condition_variable` позволяет ждать условие. Используйте `wait(lock, predicate)`, чтобы повторно проверять его после пробуждения.
- `promise` передаёт результат или исключение связанному `future`.

Deadlock — взаимное ожидание ресурсов. Livelock — активные действия без прогресса. По закону Амдала последовательная доля программы ограничивает выигрыш от распараллеливания.

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
