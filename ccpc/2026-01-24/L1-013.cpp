// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805127389495296
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int n;
    cin >> n;
    ll sum = 0, tmp = 1;
    for (int i = 1; i <= n; ++i)
        tmp *= i, sum += tmp;
    cout << sum;
}
