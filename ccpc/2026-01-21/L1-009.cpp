// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805133597065216
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int n;
    char ch;
    ll a = 0, a1, a2, b1, b2;
    cin >> n >> a1 >> ch >> a2;

    auto func = [&]() -> void
    {
        a1 = a1 * b2 + a2 * b1;
        a2 *= b2;
        a += a1 / a2;
        a1 %= a2;
        ll tmp = gcd(a1, a2);
        a1 /= tmp;
        a2 /= tmp;
    };

    for (int i = 1; i < n; ++i)
    {
        cin >> b1 >> ch >> b2;
        func();
    }
    if (a)
    {
        cout << a;
        if (a1)
            cout << ' ';
    }
    if (a1)
        cout << a1 << '/' << a2;
    if (!a && !a1)
        cout << 0;
}
