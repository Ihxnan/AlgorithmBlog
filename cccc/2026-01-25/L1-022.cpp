// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805114445873152
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int n;
    cin >> n;
    int odd = 0, even = 0;
    for (int i = 0, t; i < n; ++i)
        cin >> t, t % 2 ? ++odd : ++even;
    cout << odd << ' ' << even;
}
