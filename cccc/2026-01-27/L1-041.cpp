// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805089657536512
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int n;
    int idx = 1;
    while (cin >> n, n != 250)
        ++idx;
    cout << idx;
}
