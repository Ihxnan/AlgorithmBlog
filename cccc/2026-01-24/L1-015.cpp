// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805124398956544
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int n;
    char ch;
    cin >> n >> ch;
    for (int i = 0; i < (n + 1) / 2; ++i)
        cout << string(n, ch) << endl;
}
