// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805111694409728
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int d;
    cin >> d;
    cout << (d + 2 > 7 ? d - 5 : d + 2);
}
