// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805102173339648
#include "../../template.cpp"

void init()
{
    t = 1;
}

void solve()
{
    int n;
    cin >> n;
    int h, w, s;
    while (n--)
    {
        cin >> h >> w;
        s = (h - 100) * 1.8;
        if (abs(s - w) < s * 0.1)
            cout << "You are wan mei!" << endl;
        else if (s > w)
            cout << "You are tai shou le!" << endl;
        else
            cout << "You are tai pang le!" << endl;
    }
}
