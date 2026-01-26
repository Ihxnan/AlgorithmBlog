// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805118568873984
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int a, b, n;
    cin >> a >> b >> n;
    int ca = 0, cb = 0;
    for (int i = 0, a1, a2, b1, b2; i < n; ++i)
    {
        cin >> a1 >> a2 >> b1 >> b2;
        if (a2 == b2)
            continue;
        if (a2 == a1 + b1)
            if (++ca == a)
            {
                cout << "A" << endl
                     << cb << endl;
                return;
            }
        if (b2 == a1 + b1)
            if (++cb == b)
            {
                cout << "B" << endl
                     << ca << endl;
                return;
            }
    }
}
