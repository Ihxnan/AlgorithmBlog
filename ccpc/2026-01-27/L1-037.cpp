// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805094485180416
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int a, b;
    cin >> a >> b;
    cout << a << "/";
    if (b < 0)
        cout << "(" << b << ")";
    else
        cout << b;
    cout << "=";
    if (b == 0)
        cout << "Error";
    else
        cout << fixed << setprecision(2) << 1.0 * a / b;
}
