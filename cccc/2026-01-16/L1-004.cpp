// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805143738892288
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int n;
    cin >> n;
    cout << "Celsius = " << 5 * (n - 32) / 9 << endl;
}
