// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805119944605696
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int h, m;
    char ch;
    cin >> h >> ch >> m;
    if (h > 12 || h == 12 && m)
        for (int i = 0; i < h - 12 + bool(m); ++i)
            cout << "Dang";
    else
        cout << "Only " << setw(2) << setfill('0') << h << ":" << setw(2) << setfill('0') << m << ".  Too early to Dang.";
}
