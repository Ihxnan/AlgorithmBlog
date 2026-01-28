// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805090748055552
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int t;
    cin >> t;
    char ch;
    double n;
    while (t--)
    {
        cin >> ch >> n;
        if (ch == 'M')
            cout << fixed << setprecision(2) << n / 1.09 << endl;
        else
            cout << fixed << setprecision(2) << n * 1.09 << endl;
    }
}
