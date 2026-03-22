// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805091888906240
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int n;
    cin >> n;
    string str;
    cin.get();
    getline(cin, str);
    int cnt = str.size() % n;
    if (cnt)
        str.append(n - cnt, ' ');
    vector<string> v(str.size() / n);
    for (int i = 0; i * n < str.size(); ++i)
        v[i] = str.substr(i * n, n);
    for (int i = 0; i < n; ++i)
    {
        for (int j = v.size() - 1; j >= 0; --j)
            cout << v[j][i];
        cout << endl;
    }
}
