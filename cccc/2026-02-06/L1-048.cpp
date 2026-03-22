// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805082313310208
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int r, l;
    cin >> r >> l;
    vvi a(r, vi(l));
    cin >> a;
    cin >> r >> l;
    vvi b(r, vi(l));
    cin >> b;
    if (a[0].size() != b.size())
    {
        cout << "Error: " << a[0].size() << " != " << b.size() << endl;
        return;
    }
    vvi ans(a.size(), vi(b[0].size()));
    for (int i = 0; i < a.size(); ++i)
        for (int j = 0; j < a[0].size(); ++j)
            for (int k = 0; k < b[0].size(); ++k)
                ans[i][k] += a[i][j] * b[j][k];
    cout << a.size() << ' ' << b[0].size() << endl;
    for (int i = 0; i < a.size(); ++i)
        for (int j = 0; j < b[0].size(); ++j)
            cout << ans[i][j] << " \n"[j == b[0].size() - 1];
}
